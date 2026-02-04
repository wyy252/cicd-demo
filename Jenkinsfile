pipeline {
  agent none

  stages {
    stage('Checkout') {
      agent any
<<<<<<< HEAD
      steps { checkout scm }
=======
      steps {
        checkout scm
      }
>>>>>>> origin/main
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
          NET=$(docker network ls --format '{{.Name}}' | grep -E '^cicd-demo-multibranch_main_default$' || true)
<<<<<<< HEAD
=======

>>>>>>> origin/main
          if [ -z "$NET" ]; then
            API_CID=$(docker-compose ps -q api)
            NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s " $k}}{{end}}' "$API_CID" | awk '{print $1}')
          fi
<<<<<<< HEAD
          echo "Compose network = $NET"
=======

          echo "Compose network = $NET"

>>>>>>> origin/main
          for i in $(seq 1 30); do
            docker run --rm --network "$NET" curlimages/curl:8.6.0 -fsS http://api:5000/api/health && exit 0
            sleep 1
          done
<<<<<<< HEAD
          echo "Smoke test failed"
          exit 1
        '''
      }
    }

    stage('Main-only: Extra checks') {
      agent { label 'docker-agent' }
      when {
        branch 'main'
      }
      steps {
        sh '''
          set -eux
          echo "Running extra checks only on main..."
        '''
=======

          echo "Smoke test failed"
          exit 1
        '''
>>>>>>> origin/main
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
