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
      agent { label 'docker' }
      steps {
        sh '''
          set -eux
          # 在 api 容器内部跑 curl，避免宿主机端口冲突
          docker-compose exec -T api curl -s http://localhost:5000/api/health
          docker-compose exec -T api curl -s http://localhost:5000/api/items
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
