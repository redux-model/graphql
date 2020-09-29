rm -rf ./build ./lib ./es

yarn tsc
mv ./build/src/ ./lib/
yarn tsc --module ES6
mv ./build/src/ ./es/

yarn public-refactor --src ./src --dist ./lib
yarn public-refactor --src ./src --dist ./es
