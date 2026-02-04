pipeline {
  agent none

  stages {
    stage('Checkout') {
      agent any
      steps {
        checkout scm
      }
    }

    stage('Build & Run (Docker)') {
      agent { label 'docker' }
      steps {
        sh '''
          set -eux
          docker version
          docker-compose version || true
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

          API_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cicd-demo-multibranch_main-api-1)
          echo "API_IP=$API_IP"

          for i in $(seq 1 30); do
            if curl -fsS "http://$API_IP:5000/api/health" >/dev/null; then
              echo "health ok"
              exit 0
            fi
            sleep 1
          done

          echo "health check failed"
          docker logs cicd-demo-multibranch_main-api-1 || true
          exit 1
        '''
      }
    }

  }

  post {
    always {
      node('docker') {
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
