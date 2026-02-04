pipeline {
  agent none

  environment {
    SONAR_PROJECT_KEY  = 'cicd-demo'
    SONAR_PROJECT_NAME = 'cicd-demo'
    SONARQUBE_SERVER_NAME = 'sonarqube-local'
  }

  stages {
    stage('Checkout') {
      agent any
      steps { checkout scm }
    }

    stage('Build & Run (Docker)') {
      agent { label 'docker-agent' }
      steps {
        sh '''
          set -eux
          docker-compose up -d --build --remove-orphans
          docker-compose ps
        '''
      }
    }

    stage('Smoke test') {
      agent { label 'docker-agent' }
      steps {
        sh '''
          set -eux
          API_CID=$(docker-compose ps -q api)
          NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s " $k}}{{end}}' "$API_CID" | awk '{print $1}')
          echo "Compose network = $NET"

          for i in $(seq 1 30); do
            docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS http://api:5000/api/health && exit 0
            sleep 1
          done

          echo "Smoke test failed"
          exit 1
        '''
      }
    }

    stage('SonarQube Analysis') {
      agent { label 'docker-agent' }
      steps {
        withSonarQubeEnv('sonarqube-local') {
          sh '''
            set -eux
            echo "SONAR_HOST_URL=$SONAR_HOST_URL"
            echo "WORKSPACE PWD=$(pwd)"
            ls -la

            docker run --rm --network jenkins-net --user 0:0 \
              -e SONAR_HOST_URL="$SONAR_HOST_URL" \
              -e SONAR_TOKEN="$SONAR_AUTH_TOKEN" \
              -e SONAR_SCANNER_OPTS="-Duser.home=/tmp" \
              -v "$PWD:/usr/src" \
              -w /usr/src \
              sonarsource/sonar-scanner-cli:11 \
              -Dsonar.projectKey=cicd-demo \
              -Dsonar.projectName=cicd-demo \
              -Dsonar.sources=. \
              -Dsonar.exclusions=**/.git/**,**/dist/**,**/__pycache__/**,**/*.tar.gz \
              -Dsonar.sourceEncoding=UTF-8 \
              -Dsonar.working.directory=/usr/src/.scannerwork

            echo "=== debug: scanner output files ==="
            ls -la .scannerwork || true
            echo "=== find report-task.txt ==="
            find . -maxdepth 4 -name report-task.txt -print -exec cat {} \\; || true
          '''
        }
      }
    }



    stage('Quality Gate') {
      agent { label 'docker-agent' }
      steps {
        withSonarQubeEnv('sonarqube-local') {
          timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
          }
        }
      }
    }


  }

  post {
    always {
      node('docker-agent') {
        sh '''
          set +e
          docker-compose logs --no-color --tail=200 mysql
          docker-compose logs --no-color --tail=200 api

          docker-compose stop api mysql || true
        '''
      }
    }
  }
}
