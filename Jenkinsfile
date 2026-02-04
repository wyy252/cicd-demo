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

    stage('Debug networks') {
      agent { label 'docker-agent' }
      steps {
        sh '''
          set -eux
          docker network ls
          docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
        '''
      }
    }

    stage('SonarQube Analysis') {
      agent { label 'docker-agent' }
      steps {
        withSonarQubeEnv('sonarqube-local') {
          sh '''
            set -eux

            API_CID=$(docker-compose ps -q api)
            NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s " $k}}{{end}}' "$API_CID" | awk '{print $1}')
            echo "Compose network = $NET"

            echo "SONAR_HOST_URL=$SONAR_HOST_URL"

            for i in $(seq 1 120); do
              STATUS=$(docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS "$SONAR_HOST_URL/api/system/status" | sed -n 's/.*"status":"\\([^"]*\\)".*/\\1/p' || true)
              echo "SonarQube status=$STATUS ($i/120)"
              if [ "$STATUS" = "UP" ]; then
                break
              fi
              sleep 2
            done

            docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS "$SONAR_HOST_URL/api/system/status"

            SONAR_TOK="${SONAR_AUTH_TOKEN:-${SONAR_TOKEN:-${SONARQUBE_AUTH_TOKEN:-}}}"
            if [ -z "$SONAR_TOK" ]; then
              echo "No Sonar token injected by Jenkins."
              echo "Please check Jenkins -> Manage Jenkins -> System -> SonarQube servers -> Server authentication token"
              exit 1
            fi

            # SonarQube token 的 curl 用法：-u "TOKEN:"
            docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS \
              -u "$SONAR_TOK:" \
              "$SONAR_HOST_URL/api/authentication/validate"

            rm -rf .scannerwork || true
            docker run --rm --network "$NET" \
              -e SONAR_HOST_URL="$SONAR_HOST_URL" \
              -e SONAR_TOKEN="$SONAR_TOK" \
              -v "$PWD:/usr/src" \
              sonarsource/sonar-scanner-cli:11 \
              -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
              -Dsonar.projectName="$SONAR_PROJECT_NAME" \
              -Dsonar.sources=app \
              -Dsonar.tests=tests \
              -Dsonar.python.version=3.11 \
              -Dsonar.sourceEncoding=UTF-8

            test -f .scannerwork/report-task.txt
            echo "Found .scannerwork/report-task.txt:"
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
          docker-compose logs --no-color --tail=200 sonarqube

          docker-compose stop api mysql || true
        '''
      }
    }
  }
}
