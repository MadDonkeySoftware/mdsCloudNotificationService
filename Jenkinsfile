pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm i'
            }
        }
        stage('Verification') {
            steps {
                parallel(
                    "testing": {
                        sh 'npm run test-cov'
                    },
                    "linting": {
                        sh 'npm run lint'
                    }
                )
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'coverage/lcov-report/*', fingerprint: true
        }
    }
}