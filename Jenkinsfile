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

    success {
      emailext(
        subject: "✅ Jenkins SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        to: "YOUR_EMAIL_HERE",
        mimeType: 'text/html',
        body: """
          <p><b>Status:</b> SUCCESS</p>
          <p><b>Job:</b> ${env.JOB_NAME}</p>
          <p><b>Build:</b> #${env.BUILD_NUMBER}</p>
          <p><b>Branch:</b> ${env.BRANCH_NAME}</p>
          <p><b>URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
        """
      )
    }

    failure {
      def logText = currentBuild.rawBuild.getLog(120).join("\n")
      emailext(
        subject: "❌ Jenkins FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        to: "YOUR_EMAIL_HERE",
        mimeType: 'text/html',
        body: """
          <p><b>Status:</b> FAILURE</p>
          <p><b>Job:</b> ${env.JOB_NAME}</p>
          <p><b>Build:</b> #${env.BUILD_NUMBER}</p>
          <p><b>Branch:</b> ${env.BRANCH_NAME}</p>
          <p><b>URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
          <hr/>
          <p><b>Error details (last 120 lines):</b></p>
          <pre style="white-space: pre-wrap;">${logText}</pre>
        """
      )
    }

    always {
      echo "Post actions complete."
    }

  }
}
