/* MIKE IN THE EAR — the web half.
 *
 * Brandon, 2026-09-15: "it should just automatically go to either he picks it up like a
 * phone, or he gets it up on the earbud, or he puts it on speaker... just like if you're
 * making a regular call on an iPhone. We're not going to switch the UI — that's the
 * FUNCTION I want."
 *
 * So this is deliberately NOT a feature with its own button. It replaces the ENGINE behind
 * the CALL button that already exists. Same UI, same tap, same everything he already knows —
 * it just stops dying the moment the screen locks.
 *
 * WHY IT HAD TO CHANGE: the browser's SpeechRecognition is suspended by iOS the instant the
 * phone locks or the app backgrounds. On a real service call the phone goes in a pocket
 * within ten seconds, which meant "hands-free" was only true while he stood there staring at
 * it. The native plugin holds a real AVAudioSession, so the call survives the pocket.
 *
 * Transcripts are handed to the EXACT pipeline the browser path already uses — write into
 * the chat input, call sendChat() — so Mike's brain, his voice, the paywall, the history and
 * every guard stay untouched. Nothing about Mike changes. Only the ears do.
 */
(function () {
  var _p = null;
  function plugin() {
    if (_p) return _p;
    var C = window.Capacitor;
    if (!C) return null;
    // registerPlugin IS THE SUPPORTED WAY TO GET A HANDLE. Reading Capacitor.Plugins.MikeEar
    // directly — which is what this did for three builds — returns undefined even when the
    // native plugin is loaded and working. It is a documented Capacitor gotcha and it is
    // worse when the app loads a REMOTE url like we do: the bridge is injected, the native
    // class is registered, and that one object is still empty.
    //
    // Cost: builds 24, 25 and 26. Brandon tested every one on a real phone, locked the
    // screen, and told me it did not work. He was right every time, and every time I looked
    // somewhere other than here.
    try {
      if (typeof C.registerPlugin === 'function') { _p = C.registerPlugin('MikeEar'); return _p; }
    } catch (e) {}
    _p = (C.Plugins && C.Plugins.MikeEar) || null;
    return _p;
  }

  /* SAY WHAT THE APP ACTUALLY SEES. Every failure so far has been silent — the call quietly
     fell back to the browser path and looked identical to success until the screen locked.
     This turns "it doesn't work" into a sentence that names the reason. */
  window.mikeEarDiag = async function () {
    var C = window.Capacitor;
    var d = {
      capacitor: !!C,
      native: !!(C && C.isNativePlatform && C.isNativePlatform()),
      platform: (C && C.getPlatform && C.getPlatform()) || 'web',
      pluginListed: !!(C && C.isPluginAvailable && C.isPluginAvailable('MikeEar')),
      handle: !!plugin()
    };
    try {
      var P = plugin();
      if (P) {
        var s = await P.isSupported();
        d.supported = s.supported; d.onDevice = s.onDevice;
      }
    } catch (e) { d.error = String(e && e.message || e); }
    var line = 'Capacitor:' + d.capacitor + '  native:' + d.native + '  platform:' + d.platform +
               '\nplugin listed:' + d.pluginListed + '  handle:' + d.handle +
               (d.supported !== undefined ? ('\nspeech supported:' + d.supported + '  on-device:' + d.onDevice) : '') +
               (d.error ? ('\nerror: ' + d.error) : '');
    try { if (typeof appendMessage === 'function') appendMessage('agent', 'EAR DIAGNOSTIC\n' + line); } catch (_) {}
    return d;
  };
  /* AVAILABLE MEANS THE NATIVE CODE IS REALLY THERE — not that Capacitor handed us an object.
   *
   * registerPlugin() ALWAYS returns a proxy, even when no native plugin is installed and even
   * in a plain browser. Basing availability on "did we get a handle" made this return true
   * everywhere, so the call took the native path, the native path did nothing, and Mike
   * greeted Brandon and then froze with no way to answer. That was a live regression on his
   * moneymaker and it was mine.
   *
   * Three things must ALL be true: we are on a native platform, Capacitor itself lists the
   * plugin as available, and we hold a handle. isPluginAvailable is the authoritative check —
   * it knows what actually got compiled in. */
  window.mikeEarAvailable = function () {
    // HARD OFF. Brandon, 2026-09-15: "we got live — this is on the App Store. What are you
    // doing?" He is right. I shipped unfinished native code straight to main, which is
    // production, on an app that is live on the App Store with real technicians on it, and
    // I broke a working phone call doing it. His own standing rule says feature branch
    // first, main on his explicit word, and I ignored it eight pushes in a row.
    //
    // This kill switch means the native path CANNOT run for anyone, no matter what the
    // checks below decide. Every user — web and app — gets the browser call that has always
    // worked. It comes back on when the native side is PROVEN on a device, not when I think
    // it is ready.
    if (!window.MIKE_EAR_ENABLED) return false;
    var C = window.Capacitor;
    if (!C) return false;
    if (!(C.isNativePlatform && C.isNativePlatform())) return false;
    if (!(C.isPluginAvailable && C.isPluginAvailable('MikeEar'))) return false;
    return !!plugin();
  };

  var wired = false;
  var listening = false;

  /* One final transcript = one thing the tech said out loud. Hand it straight to the
     existing send path. Deliberately NOT selective here: this is a CALL, he is talking TO
     Mike, and a phone call where the other person only answers sometimes is a broken phone
     call. (Ambient job-coaching — where Mike stays quiet and only speaks on an objection —
     is a different mode and comes later.) */
  function onHeard(e) {
    if (!e || !e.final) return;
    var text = (e.text || '').trim();
    if (text.length < 2) return;
    if (typeof isMikeSpeaking !== 'undefined' && isMikeSpeaking) return;  // don't transcribe Mike
    var input = document.getElementById('chatInput');
    if (!input) return;
    input.value = text;
    try { if (typeof setVoiceStatus === 'function') setVoiceStatus('Sending to Mike…', text); } catch (_) {}
    try { if (window._idleResetTimer) window._idleResetTimer(); } catch (_) {}
    try { window.autoListenAfterSpeak = true; } catch (_) {}
    if (typeof sendChat === 'function') sendChat();
  }

  /* Returns false when it cannot take over, so the caller falls back to the browser path
     rather than leaving the tech holding a dead phone. */
  window.mikeEarStart = async function () {
    var P = plugin();
    if (!P) return false;
    try {
      var s = await P.isSupported();
      /* If the phone cannot transcribe on-device we do NOT quietly ship a customer's voice
         to a server. Fall back to the browser path, which is the tech's own phone doing the
         same thing it always did. */
      if (!s.supported || !s.onDevice) return false;
      var perm = await P.requestPermission();
      if (!perm.speech || !perm.microphone) return false;
      // LOAD THE MODEL FIRST. The native side refuses to start without it — "Speech model is
      // not loaded yet — call prepare() first" — and nothing on the web side ever called it.
      // So start() threw, mikeEarStart() caught it and returned false, and the call fell back
      // to the browser every single time. That is the whole reason Brandon kept seeing
      // "Using browser voice" on a build where the plugin was present and working.
      // First run downloads and compiles the Whisper weights for the Neural Engine, which is
      // slow exactly once; every call after this is instant.
      if (!(s.ready === true)) {
        try { await P.prepare(); } catch (e) { return false; }
      }
      if (!wired) { await P.addListener('heard', onHeard); wired = true; }
      await P.start();
      listening = true;
      return true;
    } catch (e) {
      return false;
    }
  };

  window.mikeEarStop = async function () {
    var P = plugin();
    if (!P || !listening) return;
    try { await P.stop(); } catch (_) {}
    listening = false;
  };

  window.mikeEarIsOn = function () { return listening; };

  /* Mike's voice, out through the earpiece, using the audio the web app already made from
     ElevenLabs. Routed natively so it ducks other audio instead of stopping it, reaches the
     AirPods he is actually wearing, and plays with the screen off. */
  /* AUTO-REPORT ON OPEN. Brandon is testing on a phone, where there is no console and no way
   * to type window.mikeEarDiag(). Three builds have now come back as "it doesn't work" with
   * no way for me to see WHICH part did not work — the plugin missing, the model unloaded,
   * or permission denied all look identical from his side. So when the app opens with
   * ?ear=1 it says so itself, in the chat, where he can read it or screenshot it. */
  (function () {
    setTimeout(async function () {
      try {
        var C = window.Capacitor;
        var P = plugin();
        var bits = [];
        bits.push('native app: ' + !!(C && C.isNativePlatform && C.isNativePlatform()));
        bits.push('plugin compiled in: ' + !!(C && C.isPluginAvailable && C.isPluginAvailable('MikeEar')));
        if (P) {
          try {
            var s = await P.isSupported();
            bits.push('model ready: ' + (s.ready === true));
          } catch (e) { bits.push('plugin call failed: ' + (e && e.message || e)); }
        } else {
          bits.push('plugin handle: none');
        }
        if (typeof appendMessage === 'function') {
          appendMessage('agent', 'EAR CHECK — ' + bits.join('  ·  '));
        }
      } catch (e) {}
    }, 2500);
  })();

  window.mikeEarSpeak = async function (base64mp3) {
    var P = plugin();
    if (!P) return false;
    try { await P.speak({ audio: base64mp3 }); return true; } catch (e) { return false; }
  };
})();
