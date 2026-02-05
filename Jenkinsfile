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
      environment {
        SCANNER_HOME = tool 'sonar-scanner'   
      }
      steps {
        withSonarQubeEnv('sonarqube-local') {
          sh '''
            set -eux
            rm -rf .scannerwork || true

            "$SCANNER_HOME/bin/sonar-scanner" \
              -Dsonar.projectKey=cicd-demo \
              -Dsonar.projectName=cicd-demo \
              -Dsonar.sources=. \
              -Dsonar.exclusions=**/.git/**,**/dist/**,**/__pycache__/**,**/*.tar.gz \
              -Dsonar.sourceEncoding=UTF-8

            ls -la .scannerwork
            cat .scannerwork/report-task.txt
          '''
        }
      }
    }

    stage('Quality Gate') {
      agent { label 'docker-agent' }
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
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
