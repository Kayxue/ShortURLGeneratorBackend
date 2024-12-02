FROM denoland/deno:2.1.1

# The port that your application listens to.
EXPOSE 3000

# Prefer not to run as root.
USER root

WORKDIR /app

# These steps will be re-run upon each file change in your working directory:
COPY . .

# Install dependencies
RUN deno install --allow-scripts

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["run", "-A", "--env-file=.env", "main.ts"]