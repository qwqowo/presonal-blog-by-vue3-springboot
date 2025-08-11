# 第一阶段：依赖缓存
FROM maven:3.9-eclipse-temurin-21 AS dependencies
WORKDIR /app

# 配置国内Maven镜像源
RUN mkdir -p /root/.m2 && \
    echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
    xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd"> \
    <mirrors> \
      <mirror> \
        <id>aliyun</id> \
        <mirrorOf>central</mirrorOf> \
        <name>阿里云公共仓库</name> \
        <url>https://maven.aliyun.com/repository/public</url> \
      </mirror> \
    </mirrors> \
    </settings>' > /root/.m2/settings.xml

# 仅复制pom.xml，利用Docker缓存
COPY pom.xml .
# 预先下载依赖
RUN mvn dependency:go-offline -B

# 第二阶段：编译构建
FROM dependencies AS build
WORKDIR /app
# 复制源码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# 第三阶段：运行环境
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 仅复制构建结果
COPY --from=build /app/target/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 优化JVM参数
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Dspring.profiles.active=prod", "-Dfile.encoding=UTF-8", "-jar", "app.jar"]