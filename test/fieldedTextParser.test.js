'use strict';

// core requires
var fs = require('fs');
var path = require('path');

// external requires
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');

// local files
var plugins = require('../lib');
var helper = require('./lib/helper');

var fsOptions = { encoding: 'utf8' };
var PORT = process.env.UNIT_TEST_PORT || 3333;
var CLIENT;
var SERVER;
var DATA_CSV = fs.readFileSync(
    path.join(__dirname, '/files/data-csv.txt'),
    fsOptions
);
var DATA_TSV = fs.readFileSync(
    path.join(__dirname, '/files/data-tsv.txt'),
    fsOptions
);
var OBJECT_CSV = require(path.join(__dirname, '/files/object-csv.json'));
var OBJECT_TSV = require(path.join(__dirname, '/files/object-tsv.json'));

/**
 * Tests
 */

describe('fielded text parser', function () {

    before(function (done) {
        SERVER = restify.createServer({
            dtrace: helper.dtrace,
            log: helper.getLog('server')
        });
        SERVER.use(plugins.bodyParser());
        SERVER.post('/data', function respond(req, res, next) {
            res.send({
                status: 'okay',
                parsedReq: req.body
            });
            return next();
        });
        SERVER.listen(PORT, '127.0.0.1', function () {
            CLIENT = restifyClients.createClient({
                url: 'http://127.0.0.1:' + PORT,
                dtrace: helper.dtrace,
                retry: false,
                agent: false
            });
            done();
        });
    });

    after(function (done) {
        SERVER.close(done);
    });


    it('should parse CSV body', function (done) {
        var options = {
            path: '/data',
            headers: {
                'Content-Type': 'text/csv'
            }
        };
        CLIENT.post(options, function (err, req) {
            assert.ifError(err);
            req.on('result', function (errReq, res) {
                assert.ifError(errReq);
                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    res.body += chunk;
                });
                res.on('end', function () {
                    res.body = JSON.parse(res.body);
                    var parsedReqStr = JSON.stringify(res.body.parsedReq);
                    var objectStr = JSON.stringify(OBJECT_CSV);
                    assert.equal(parsedReqStr, objectStr);
                    done();
                });
            });
            req.write(DATA_CSV);
            req.end();
        });
    });

    it('should parse TSV body', function (done) {
        var options = {
            path: '/data',
            headers: {
                'Content-Type': 'text/tsv'
            }
        };
        CLIENT.post(options, function (err, req) {
            assert.ifError(err);
            req.on('result', function (errReq, res) {
                assert.ifError(errReq);
                res.body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    res.body += chunk;
                });
                res.on('end', function () {
                    res.body = JSON.parse(res.body);
                    var parsedReqStr = JSON.stringify(res.body.parsedReq);
                    var objectStr = JSON.stringify(OBJECT_TSV);
                    assert.equal(parsedReqStr, objectStr);
                    done();
                });
            });
            req.write(DATA_TSV);
            req.end();
        });
    });

});

