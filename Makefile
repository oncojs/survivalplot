export GIT_REPO = oncojs/survivalplot

PATH := node_modules/.bin:$(PATH)
FDT_DIR := node_modules/@ncigdc/buildjs

include $(FDT_DIR)-scripts/Makefile
