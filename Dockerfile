FROM denoland/deno:2.0.6

# The port that your application listens to.
EXPOSE 3000

# Prefer not to run as root.
USER root

WORKDIR /app

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["run", "-A", "main.ts"]