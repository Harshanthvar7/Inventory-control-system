
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        IMAGE_NAME = 'lakshminarayananr0411/inventory-control-system'
        IMAGE_TAG  = 'products-v1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Project Files') {
            steps {
                powershell '''
                    $required = @(
                        "Dockerfile",
                        "index.html",
                        "dashboard.html",
                        "products.html",
                        "stock-movement.html",
                        "shared",
                        "deployment.yaml"
                    )

                    foreach ($file in $required) {
                        if (-not (Test-Path $file)) {
                            throw "Required project file is missing: $file"
                        }
                    }

                    Write-Host "All required InvenTrack files are present."
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell '''
                    docker build -t "$env:IMAGE_NAME`:$env:IMAGE_TAG" .

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed."
                    }
                '''
            }
        }

        stage('Verify Docker Image') {
            steps {
                powershell '''
                    docker image inspect "$env:IMAGE_NAME`:$env:IMAGE_TAG"

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image verification failed."
                    }

                    Write-Host "Docker image verified successfully."
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-token-v2',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    powershell '''
                        $ErrorActionPreference = "Stop"

                        if ([string]::IsNullOrWhiteSpace($env:DOCKERHUB_USER)) {
                            throw "Docker Hub username is empty."
                        }

                        if ([string]::IsNullOrWhiteSpace($env:DOCKERHUB_TOKEN)) {
                            throw "Docker Hub token is empty."
                        }

                        Write-Host "Docker Hub username is configured."
                        Write-Host "Docker Hub token is present."

                        $token = $env:DOCKERHUB_TOKEN.Trim()

                        $token | docker login `
                            --username $env:DOCKERHUB_USER `
                            --password-stdin

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker Hub authentication failed. Check the saved Jenkins credential."
                        }

                        Write-Host "Docker Hub authentication successful."

                        docker push "$env:IMAGE_NAME`:$env:IMAGE_TAG"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker image push failed."
                        }

                        Write-Host "Docker image pushed successfully."
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                powershell '''
                    kubectl apply -f deployment.yaml

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes deployment apply failed."
                    }

                    kubectl rollout status deployment/inventrack-products --timeout=120s

                    if ($LASTEXITCODE -ne 0) {
                        throw "Kubernetes rollout failed."
                    }

                    kubectl get pods -l app=inventrack-products
                    kubectl get service inventrack-service
                '''
            }
        }
    }

    post {
        success {
            echo 'InvenTrack CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'InvenTrack CI/CD pipeline failed. Check the stage logs.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
