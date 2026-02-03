pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Start services (MySQL + API)') {
      steps {
        sh 'docker compose up -d --build'
        sh 'docker ps'
      }
    }

    stage('Smoke test') {
      steps {
        sh 'curl -s http://localhost:5000/api/health'
        sh 'curl -s http://localhost:5000/api/items'
      }
    }

    stage('E2E (Playwright)') {
      steps {
        dir('tests') {
          sh 'npm ci'
          sh 'npx playwright install --with-deps'
          sh 'npm test'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'tests/playwright-report/**', allowEmptyArchive: true
        }
      }
    }

    stage('Performance (k6)') {
      steps {
        sh 'k6 run perf/loadtest.js'
      }
    }
  }

  post {
    always {
      sh 'docker compose down'
    }
  }
}
