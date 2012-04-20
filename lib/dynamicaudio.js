/**
 * @param {Object} args
 * @constructor
 */
function DynamicAudio(args) {
  if (this instanceof DynamicAudio) {
    if (typeof this.init === 'function') {
      this.init.apply(this, (args && args.callee) ? args : arguments);
    }
  }
  else {
    return new DynamicAudio(arguments);
  }
}

DynamicAudio.VERSION = '<%= version %>';
DynamicAudio.nextId = 1;

DynamicAudio.prototype = {
  nextId: null,
  swf: 'dynamicaudio.swf',

  audioElement: null,
  flashWrapper: null,
  flashElement: null,

  init: function(opts) {
    var self = this;
    self.id = DynamicAudio.nextId++;

    if (opts && typeof opts['swf'] !== 'undefined') {
      self.swf = opts['swf'];
    }

    // Attempt to create an audio element
    if (typeof Audio !== 'undefined') {
      self.audioElement = new Audio();
      if (self.audioElement.mozSetup) {
        self.audioElement.mozSetup(1, SAMPLE_RATE);
        return;
      }
    }

    // Fall back to creating flash player
    self.audioElement = null;
    self.flashWrapper = document.createElement('div');
    self.flashWrapper.id = 'dynamicaudio-flashwrapper-' + self.id;
    // Credit to SoundManager2 for this:
    var s = self.flashWrapper.style;
    s['position'] = 'fixed';
    s['width'] = s['height'] = '8px'; // must be at least 6px for flash to run fast
    s['bottom'] = s['left'] = '0px';
    s['overflow'] = 'hidden';
    self.flashElement = document.createElement('div');
    self.flashElement.id = 'dynamicaudio-flashelement-' + self.id;
    self.flashWrapper.appendChild(self.flashElement);

    document.body.appendChild(self.flashWrapper);

    swfobject.embedSWF(
        self.swf,
        self.flashElement.id,
        '8',
        '8',
        '9.0.0',
        null,
        null,
        {'allowScriptAccess': 'always'},
        null,
        function(e) {
          self.flashElement = e.ref;
        }
    );
  },

  write: function(samples) {
    if (this.audioElement !== null) {
      this.audioElement.mozWriteAudio(samples);
    }
    else if (this.flashElement !== null) {
      var out = samples.map(function(sample) {
        return Math.floor(sample * 32768 / 128);
      });
      this.flashElement.write(out.join(' '));
    }
  },

  writeInt: function(samples) {
    if (this.audioElement !== null) {
      var out = samples.map(function(sample) {
        return sample / 128;
      });
      out = new Float32Array(out);
      try {
        this.audioElement.mozWriteAudio(out);
      } catch (e) {
        console.log(e, out);
      }
    }
    else if (this.flashElement !== null) {
      this.flashElement.write(samples.join(' '));
    }
  }
};