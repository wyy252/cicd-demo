pipeline {
  agent none

  environment {
    // SonarQube project identifiers
    SONAR_PROJECT_KEY = 'cicd-demo'
    SONAR_PROJECT_NAME = 'cicd-demo'
  }

  stages {
    stage('Checkout') {
      agent any
      steps {
        checkout scm
      }
    }

    stage('Build & Run (Docker)') {
      agent { label 'docker-agent' }
      steps {
        sh '''
          set -eux
          docker-compose down -v || true
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

          # Find compose network name
          NET=$(docker network ls --format '{{.Name}}' | grep -E '^cicd-demo-multibranch_main_default$' || true)

          if [ -z "$NET" ]; then
            API_CID=$(docker-compose ps -q api)
            NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s " $k}}{{end}}' "$API_CID" | awk '{print $1}')
          fi

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

            NET=$(docker network ls --format '{{.Name}}' | grep -E '^cicd-demo-multibranch_main_default$' || true)

            if [ -z "$NET" ]; then
              API_CID=$(docker-compose ps -q api)
              NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s " $k}}{{end}}' "$API_CID" | awk '{print $1}')
            fi

            echo "Compose network = $NET"

            docker run --rm --network "$NET" \
              -e SONAR_HOST_URL="$SONAR_HOST_URL" \
              -e SONAR_TOKEN="$SONAR_AUTH_TOKEN" \
              -v "$PWD:/usr/src" \
              sonarsource/sonar-scanner-cli:10 \
              -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
              -Dsonar.projectName="$SONAR_PROJECT_NAME" \
              -Dsonar.sources=app \
              -Dsonar.tests=tests \
              -Dsonar.python.version=3.11 \
              -Dsonar.sourceEncoding=UTF-8 \
              -Dsonar.token="$SONAR_AUTH_TOKEN"
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
          docker-compose down -v
        '''
      }
    }
  }
}
