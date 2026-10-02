APP_NAME=iam

SWAGGER := github.com/swaggo/swag/cmd/swag
swagger:
	go install $(SWAGGER)@latest
	@echo "Generating Swagger documentation..."
	swag init --parseDependency --output ./cmd/server/docs --generalInfo cmd/server/main.go
	@echo "Swagger generated"

deps-reset:
	cd ./cmd/server
	git checkout -- go.mod
	go mod tidy
	go mod vendor

tidy:
	cd ./cmd/server
	go mod tidy
	go mod vendor

deps-upgrade:
	cd ./cmd/server
	# go get $(go list -f '{{if not (or .Main .Indirect)}}{{.Path}}{{end}}' -m all)
	go get -u -t -d -v ./...
	go mod tidy
	go mod vendor

build:
	echo "Start compiling..."
	go build -o $(APP_NAME) ./cmd/server/.
	echo "Build success"

deps-cleanCache:
	go clean -modcache

docker-build:
	@echo "Building Docker image..."
	docker build -t $(APP_NAME) -f ./Dockerfile ../../../../../../
	@echo "Docker image built"

docker-run:
	@echo "Running Docker image..."
	docker run --name $(APP_NAME) $(APP_NAME)
	@echo "Docker image run"

docker-build-debug:
	@echo "Building Docker Debug image..."
	docker build -t $(APP_NAME) -f ./DockerfileDebug ../../../../../
	@echo "Docker Deb  image built"

docker-run-debug:
	@echo "Running Docker Debug image..."
	docker run --rm -p 8060:8060 -p 40000:40000 --name $(APP_NAME) $(APP_NAME)
	@echo "Docker Debug image run"

test:
	go test

run-linter:
	echo "Starting linters..."
	golangci-lint run ./...
