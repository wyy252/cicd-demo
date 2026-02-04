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

          # Fallback: inspect the api container and grab its first network name
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

    stage('Build Artifact') {
      agent { label 'docker-agent' }
      steps {
        sh '''
          set -eux

          # Ensure zip exists (agent base image may not include it)
          (command -v zip >/dev/null 2>&1) || (
            (command -v apt-get >/dev/null 2>&1 && apt-get update && apt-get install -y zip) || true
          )
          (command -v zip >/dev/null 2>&1) || (
            (command -v apk >/dev/null 2>&1 && apk add --no-cache zip) || true
          )
          zip -v

          # Versioning: semantic-ish version using Jenkins build number
          VERSION="1.0.${BUILD_NUMBER}"
          echo "VERSION=$VERSION" | tee artifact_version.txt

          ART="cicd-demo-${VERSION}.zip"
          echo "ARTIFACT=$ART" | tee artifact_name.txt

          rm -f *.zip || true

          # Package the repo essentials (exclude git + caches)
          zip -r "$ART" \
            app db tests perf docker-compose.yml Jenkinsfile \
            -x "*.git*" -x "__pycache__/*" -x "*.pyc"

          ls -lh "$ART"
        '''
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
        archiveArtifacts artifacts: '*.zip, artifact_version.txt, artifact_name.txt', fingerprint: true, onlyIfSuccessful: false
      }
    }
  }
}
