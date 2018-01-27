const { setTimeout } = require('timers');
const { Readable, Writable } = require('stream');
const assert = require('assert');
const StreamsMessageChannel = require('../index.js');

class FakeReadable extends Readable {
    
    constructor() {
        super({
            highWaterMark: 1
        });
        this.strings = [];
        this.readPending = false; 
    }

    _read(size) {
        if (this.strings.length > 0) {
            const str = this.strings.shift()
            this.push(str);
            this.readPending = false;
        } else {
            this.readPending = true;
        }
    }

    write(string) {
        if (this.readPending) {
            this.push(string)
        } else {
            this.strings.push(string);
        }
    }

    end() {
        this.strings.push(null);
    }

    close() {
        this.end();
        this.emit('close');
    }
   
}

describe('FakeReadable', () => {
    it('synchronous write should emit data event', (done) => {
        const stream = new FakeReadable()
        const listener = (data) => {
            assert.equal(data, 'str')
            done()
        }
        stream.addListener('data', listener)
        stream.write('str')
    })
    it('asynchronous write should emit data event', (done) => {
        const stream = new FakeReadable()
        const listener = (data) => {
            assert.equal(data, 'str')
            done()
        }
        stream.addListener('data', listener)
        setTimeout(() => {
            stream.write('str')
        }, 1) 
    })
    it('write 2 x times should emit 2 data events', (done) => {
        const stream = new FakeReadable()
        let times = 0
        const listener = (data) => {
            assert.equal(data, 'str')
            times++
            if (times == 2) {
                done()
            }
        }
        stream.addListener('data', listener)
        stream.write('str')
        stream.write('str')
    })
    it('end should emit end event', (done) => {
        const stream = new FakeReadable()
        const listener = (end) => {
            done()
        }
        stream.addListener('data', () => { }) // data listener is needed because once registered read method will be called
        stream.addListener('end', listener)
        stream.end()
    })
    it('close should emit close event', (done) => {
        const stream = new FakeReadable()
        const listener = (close) => {
            done()
        }
        stream.addListener('close', listener)
        stream.close()
    })
})

describe('StreamsMessageChannel', () => {
    const readableStream = new FakeReadable()
    describe('sending', () => {
        it('should send text message to output stream', () => {
            const channel = new StreamsMessageChannel(readableStream, null)
            channel.start()
            channel.send('textMessage')
        })
    })
    describe('receiving', () => {
        it('should read encoded text message from input stream and notify listener', () => {

        })
    })
})