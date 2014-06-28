// Generated by LiveScript 1.2.0
var fs, fw, path, unpack, EventEmitter, findup, symlinkSync, chmodSync, readdirSync, join, dirname, normalize, ref$, next, copy, isFile, isDir, tmpdir, rm, mk, read, write, clone, addExtension, isWin, isString, isObject, extract, apply, mkDirs, winBinScript;
fs = require('fs');
fw = require('fw');
path = require('path');
unpack = require('./unpack');
EventEmitter = require('events').EventEmitter;
findup = require('findup-sync');
symlinkSync = fs.symlinkSync, chmodSync = fs.chmodSync, readdirSync = fs.readdirSync;
join = path.join, dirname = path.dirname, normalize = path.normalize;
ref$ = require('./utils'), next = ref$.next, copy = ref$.copy, isFile = ref$.isFile, isDir = ref$.isDir, tmpdir = ref$.tmpdir, rm = ref$.rm, mk = ref$.mk, read = ref$.read, write = ref$.write, clone = ref$.clone, addExtension = ref$.addExtension, isWin = ref$.isWin, isString = ref$.isString, isObject = ref$.isObject;
module.exports = extract = function(options){
  var ref$, path, dest, tmpdir, emitter, errored, clean, cleanError, onEnd, onEntry, onMsg, onError, extractor, extractorFn, copyBinFn, getExtractFiles, extractArchives, copyNarJson, extractNar, extractTasks, doExtract, e;
  options == null && (options = {});
  ref$ = options = apply(
  options), path = ref$.path, dest = ref$.dest, tmpdir = ref$.tmpdir;
  emitter = new EventEmitter;
  errored = false;
  clean = function(){
    try {
      return rm(tmpdir);
    } catch (e$) {}
  };
  cleanError = function(){
    clean();
    try {
      if (dest !== process.cwd()) {
        return rm(dest);
      }
    } catch (e$) {}
  };
  onEnd = function(){
    clean();
    if (!errored) {
      return emitter.emit('end', options);
    }
  };
  onEntry = function(entry){
    if (entry) {
      return emitter.emit('entry', entry);
    }
  };
  onMsg = function(msg){
    if (msg) {
      return emitter.emit('message', msg);
    }
  };
  onError = function(err){
    cleanError();
    if (!errored) {
      emitter.emit('error', err);
    }
    return errored = true;
  };
  extractor = function(options, type){
    return function(done){
      var path, dest, createLink, processGlobalBinaries, setExecutionPerms, extractEnd, doExtractor;
      path = options.path, dest = options.dest;
      if (!isFile(
      path)) {
        return onError(
        new Error('The given path is not a file'));
      }
      createLink = function(name, path){
        var binPath, root, binDir, binFile;
        binPath = join(dest, path);
        if (isFile(
        binPath)) {
          if (root = findup('package.json', {
            cwd: dirname(
            binPath)
          })) {
            binDir = join(dirname(
            root), '../../../bin');
            binFile = join(binDir, name);
            if (!isDir(
            binDir)) {
              mk(binDir);
            }
            if (isWin) {
              return write(binFile + ".cmd", winBinScript(
              binPath));
            } else {
              return symlinkSync(binPath, binFile);
            }
          }
        }
      };
      processGlobalBinaries = function(pkg){
        var bin, name, path, own$ = {}.hasOwnProperty, results$ = [];
        bin = pkg.bin;
        if (isString(
        bin)) {
          return createLink(pkg.name, bin);
        } else if (isObject(
        bin)) {
          for (name in bin) if (own$.call(bin, name)) {
            path = bin[name];
            if (path) {
              results$.push(createLink(name, path));
            }
          }
          return results$;
        }
      };
      setExecutionPerms = function(){
        var depsBinDir, binDir;
        depsBinDir = join(dest, 'node_modules', '.bin');
        binDir = join(dest, 'bin');
        return [binDir, depsBinDir].filter((function(it){
          return isDir(it);
        })).forEach(function(dir){
          return readdirSync(
          dir).forEach(function(it){
            try {
              return chmodSync(join(dir, it), '775');
            } catch (e$) {}
          });
        });
      };
      extractEnd = function(){
        var pkg;
        if (type === 'global-dependency') {
          pkg = read(
          join(dest, 'package.json'));
          if (pkg) {
            processGlobalBinaries(
            pkg);
          }
        }
        setExecutionPerms();
        return done();
      };
      return doExtractor = function(){
        if (!isDir(
        dest)) {
          mk(
          dest);
        }
        return unpack(
        options).on('error', onError).on('entry', onEntry).on('end', extractEnd);
      }();
    };
  };
  extractorFn = function(it){
    var options;
    options = {
      gzip: false,
      path: join(tmpdir, it.archive),
      dest: join(dest, it.dest),
      checksum: it.checksum
    };
    return extractor(options, it.type);
  };
  copyBinFn = function(options){
    return function(done){
      var origin, target;
      origin = join(tmpdir, options.archive);
      target = join(dest, options.dest);
      if (!isDir(
      target)) {
        mk(target);
      }
      return copy(origin, target, done);
    };
  };
  getExtractFiles = function(nar){
    var tasks;
    tasks = [];
    nar.files.forEach(function(it){
      emitter.emit('archive', it);
      if (it.type === 'binary') {
        return tasks.push(
        copyBinFn(
        it));
      } else {
        return tasks.push(
        extractorFn(
        it));
      }
    });
    return tasks;
  };
  extractArchives = function(done){
    var nar;
    nar = read(
    join(tmpdir, '.nar.json'));
    emitter.emit('info', nar);
    return fw.series(getExtractFiles(
    nar), done);
  };
  copyNarJson = function(done){
    var origin;
    origin = join(tmpdir, '.nar.json');
    return copy(origin, dest, function(err){
      if (err) {
        return onError(
        err);
      }
      return done();
    });
  };
  extractNar = function(){
    var config;
    config = clone(
    options);
    config.dest = tmpdir;
    return extractor(
    config);
  }();
  extractTasks = function(){
    return fw.series([extractNar, extractArchives, copyNarJson], function(err){
      if (err) {
        return onError(
        err);
      }
      return onEnd();
    });
  };
  doExtract = function(){
    return next(function(){
      mkDirs(dest, tmpdir);
      emitter.emit('start', dest);
      return extractTasks();
    });
  };
  try {
    doExtract();
  } catch (e$) {
    e = e$;
    onError(
    e);
  }
  return emitter;
};
apply = function(options){
  return {
    gzip: true,
    tmpdir: tmpdir(),
    dest: options.dest || process.cwd(),
    path: addExtension(
    options.path)
  };
};
mkDirs = function(dest, tmpdir){
  if (!isDir(
  dest)) {
    mk(dest);
  }
  if (!isDir(
  tmpdir)) {
    return mk(tmpdir);
  }
};
winBinScript = function(path){
  path = normalize(
  path);
  return "@ECHO OFF\n@IF EXIST \"%~dp0\\node.exe\" (\n  \"%~dp0\\node.exe\" \"" + path + "\" %*\n) ELSE (\n  node \"" + path + "\" %*\n)";
};