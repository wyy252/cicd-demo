pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Run (Docker)') {
      agent { label 'docker' }   
      steps {
        sh 'docker version'
        sh 'docker compose up -d --build'
        sh 'docker ps'
      }
    }

    stage('Smoke test') {
      agent { label 'docker' }   
        sh 'curl -s http://localhost:5000/api/health'
        sh 'curl -s http://localhost:5000/api/items'
      }
    }
  }

  post {
    always {
      sh 'docker compose down'
    }
  }
}
