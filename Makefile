.PHONY: clean
clean:
	@bash -c "set -e; if [ -d .git ]      ; \
		then echo 'In-git-mode'       ; \
			git reset --hard HEAD ; \
			git clean -xfd .      ; \
		else \
			echo 'No method to clean in non-git-mode' ; \
			exit 1 ; \
		fi"

.PHONY: build
build: clean
	pnpm install
# FIXME: Required for build without types defination error?
	pnpm i --save-dev @types/node
	pnpm run build
