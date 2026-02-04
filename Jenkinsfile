pipeline {
  agent none

  environment {
    SONAR_PROJECT_KEY  = 'cicd-demo'
    SONAR_PROJECT_NAME = 'cicd-demo'
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
          docker-compose down || true
          docker-compose up -d --build
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

            if [ -z "${SONAR_AUTH_TOKEN:-}" ] && [ -z "${SONAR_TOKEN:-}" ] && [ -z "${SONARQUBE_AUTH_TOKEN:-}" ]; then
              echo "No Sonar token injected. Check Jenkins SonarQube server config."
              exit 1
            fi

            SONAR_TOK="${SONAR_AUTH_TOKEN:-${SONAR_TOKEN:-${SONARQUBE_AUTH_TOKEN:-}}}"
            docker run --rm --network jenkins-net curlimages/curl:8.6.0 -fsS "$SONAR_HOST_URL/api/system/status"

            rm -rf .scannerwork || true

            docker run --rm --network jenkins-net \
              -e SONAR_HOST_URL="$SONAR_HOST_URL" \
              -e SONAR_TOKEN="$SONAR_TOK" \
              -v "$PWD:/usr/src" \
              sonarsource/sonar-scanner-cli:11 \
              -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
              -Dsonar.projectName="$SONAR_PROJECT_NAME" \
              -Dsonar.sources=. \
              -Dsonar.exclusions=**/.git/**,**/dist/**,**/__pycache__/**,**/*.tar.gz \
              -Dsonar.sourceEncoding=UTF-8


            test -f .scannerwork/report-task.txt
            echo "report-task.txt:"
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
          docker-compose down || true
        '''
      }
    }
  }
}
