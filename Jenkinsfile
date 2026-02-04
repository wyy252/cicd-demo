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
      steps {
        sh '''
          set -eux

          NET=$(docker network ls --format '{{.Name}}' | grep -E 'cicd-demo.*_default$' | head -n 1)

          echo "Detected network: ${NET}"

          for i in $(seq 1 30); do
            if docker run --rm --network "${NET}" curlimages/curl:8.6.0 -fsS http://api:5000/api/health; then
              echo "Smoke test passed"
              exit 0
            fi
            sleep 1
          done

          echo "Smoke test failed"
          exit 1
        '''
      }
    }
    stage('Debug Info') {
      steps {
        sh '''
          set +e
          echo "=== WHOAMI / PWD ==="
          whoami
          pwd

          echo "=== DOCKER INFO ==="
          docker version
          docker info | head -n 60

          echo "=== CONTAINERS ==="
          docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

          echo "=== COMPOSE PROJECT (guess) ==="
          ls -la
          echo "--- docker-compose.yml ---"
          sed -n '1,200p' docker-compose.yml || true

          echo "=== NETWORKS (filtered) ==="
          docker network ls | grep -E 'cicd-demo|jenkins|default' || true

          echo "=== COMPOSE PS ==="
          docker-compose ps || true

          echo "=== INSPECT COMPOSE NETWORK ==="
          NET=$(docker network ls --format '{{.Name}}' | grep -E 'cicd-demo.*_default$' | head -n 1)
          echo "NET=$NET"
          docker network inspect "$NET" | head -n 80 || true

          echo "=== TRY CURL FROM NETWORK ==="
          docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS http://api:5000/api/health || true
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
