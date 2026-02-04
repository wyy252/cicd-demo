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
        sh 'docker version'
        sh 'docker compose up -d --build'
        sh 'docker ps'
      }
    }

    stage('Smoke test') {
      agent { label 'docker' }
      steps {
        sh 'curl -s http://localhost:5000/api/health'
        sh 'curl -s http://localhost:5000/api/items'
      }
    }
  }

  post {
    always {
      node('docker') {
        sh 'docker compose down || true'
      }
    }
  }
}
