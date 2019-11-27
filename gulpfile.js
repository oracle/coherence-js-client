
/*
    "gulp-concat": "^2.6.1",
    "gulp-protobuf": "^1.0.1",
*/

const protobuf = require("gulp-protobuf");
const concat = require("gulp-concat");

const { src, dest, series } = require("gulp");

const del = require("del");

function protoGen(cb) {
  return src("src/cache/proto/*.proto")
    .pipe(
      protobuf.pbjs({
        target: "static-module",
        wrap: "commonjs"
      })
    )
    .pipe(dest("src/cache/generated"));
}

function protoTs(cb) {
  return src("src/cache/generated/*.js")
    .pipe(protobuf.pbts({}))
    .pipe(dest("src/cache/generated"));
}

function genTs(cb) {
  return src("src/cache/proto/*.proto")
    .pipe(
      protobuf.pbjs({
        target: "src/cache/proto",
        wrap: "commonjs"
      })
    )
    .pipe(protobuf.pbts())
    .pipe(dest("src/cache/proto"));
}

function mergeProtos(cb) {
  return src("./src/cache/proto/*.proto")
    .pipe(concat("named_cache.proto"))
    .pipe(dest("./src/cache/proto"));
}

function clean(cb) {
  return del("dist").then(del("src/cache/generated"));
}

// exports.protoGen = protoGen;
// exports.protoTs = protoTs;
// exports.clean = clean;

//exports.proto = series(clean, protoGen, protoTs);
exports.merge = series(clean, mergeProtos);
