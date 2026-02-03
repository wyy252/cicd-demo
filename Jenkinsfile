pipeline {
  agent none

  stages {

    stage('Build & Run') {
      agent { label 'docker' }
      steps {
        sh 'docker --version'
        sh 'docker compose up -d --build'
      }
    }

    stage('Test') {
      agent { label 'docker' }
      steps {
        sh 'curl http://localhost:5000/api/health'
      }
    }
  }
}
