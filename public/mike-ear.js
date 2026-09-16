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
 * 2026-09-16 — WHAT CHANGED, AND WHY THE EAR ALONE WAS NEVER ENOUGH.
 * Transcripts USED to be handed to the browser pipeline — write into the chat input, call
 * sendChat(). That is what made "I close the phone and it closes the call" inevitable: the
 * ear survives the lock, but the thing it handed the words to does not. iOS suspends this
 * entire file the moment the screen goes off.
 *
 * So the phone now carries the CALL — hear, ask Mike, speak the answer — in native code.
 * This layer hands down the token and the persona while the app is still awake, then draws
 * the conversation whenever he happens to be looking.
 *
 * What did NOT move: Mike's brain, the safety and pricing guards, the manual library,
 * warranty. All still server-side, all still fixable in minutes with no App Store review.
 * The phone carries the call, not the intelligence.
 */
(function () {
  /* Bump this with the ?v= in index.html's loader. Without it, "is he even running the fix?"
     costs a round trip through Brandon every single time. */
  var EAR_BUILD = 'ear-v19';
  /* THE APP'S OWN BUILD NUMBER, straight from the phone.
     The web half updates the instant it deploys; the APP half only updates when he installs
     it from TestFlight. The two drifting apart looks exactly like a broken feature, and on
     2026-09-16 it cost a round of "still doesn't work" that was really "you're on the old
     app." Every report now carries both, so which-build-is-he-on is never a question again. */
  var _nativeBuild = '';

  /* TELL THE SERVER, NOT THE SCREEN.
   *
   * Every attempt to diagnose this has either been invisible (console on a phone I cannot
   * reach) or destructive (a toast and then a spoken line, both of which cut Mike off
   * mid-sentence). Brandon has spent his whole evening being my debugger.
   *
   * This posts the ear's state to the existing /api/client-error endpoint, which already
   * ignores failures and never blocks the caller. I read it out of the events table. He sees
   * nothing, hears nothing, and I stop guessing. */
  /* THE FIELD NAME WAS WRONG, SO EVERY DETAIL WAS THROWN AWAY.
     /api/client-error stores `detail`. This sent `message`. The server read a field that
     was never there, so all fourteen reports from Brandon's phone landed with detail:null —
     the endpoint built specifically so he would never have to describe a failure to me
     recorded only THAT something happened, never what. I could see the ear go deaf and not
     one reason why. Same class of mistake as the three silent failures last night: the
     instrument was broken, not the thing it measured. `build` is sent for the same reason —
     "which version is on his phone" was unanswerable and it is the first question every time. */
  function report(stage, detail) {
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'ear_' + stage,
          detail: String(detail || '').slice(0, 300),
          where: 'mike-ear.js',
          build: EAR_BUILD + (_nativeBuild ? ('/app-' + _nativeBuild) : '/app-?'),
          token: (window.currentUser && window.currentUser.token) || null
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  var _p = null;
  /* The in-flight model warm-up. One download, shared by the preload on open and by anyone
     who taps Call before it finishes. */
  var _warm = null;
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
    // Console only — NEVER appendMessage. Anything posted as Mike goes through
    // text-to-speech in voice mode, so a debug line gets read aloud over him mid-sentence.
    // mikeEarDiag() stays available to call by hand; it just cannot talk any more.
    try { console.log('[ear] ' + line.replace(/\n/g, ' | ')); } catch (_) {}
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
  /* True once the phone has the token and the persona and is carrying the call itself.
     Gates the old web send path so Mike is never asked the same question twice. */
  var _nativeCall = false;

  /* One final transcript = one thing the tech said out loud. Hand it straight to the
     existing send path. Deliberately NOT selective here: this is a CALL, he is talking TO
     Mike, and a phone call where the other person only answers sometimes is a broken phone
     call. (Ambient job-coaching — where Mike stays quiet and only speaks on an objection —
     is a different mode and comes later.) */
  /* SILENCE IS THE ONE THING THAT NEVER REPORTED ITSELF.
     Brandon's 06:00 test: supported → permission → started, then nothing, forever. Three
     completely different faults produce that same nothing — a mic handing us no buffers, a
     mic handing us sound too quiet to cross the speech threshold, or Whisper transcribing to
     an empty string. Without this timer all three are indistinguishable and the next step is
     guesswork, which is what cost him his evening. The native side answers WHICH; this
     guarantees we at least always learn THAT. */
  var _deafTimer = null;
  function watchForSilence() {
    clearTimeout(_deafTimer);
    _deafTimer = setTimeout(function () {
      report('deaf', 'listening 20s, zero transcripts');
    }, 20000);
  }

  /* MIKE'S GREETING WAS BEING TREATED AS THE TECHNICIAN TALKING.
     Brandon, 2026-09-16: "it still interrupts Mike and doesn't let me talk." His phone
     reported in=MicrophoneBuiltIn — speakerphone. The greeting is spoken by THIS layer, and
     the native ear cannot tell Mike's voice from his. So it transcribed Mike, sent Mike's own
     greeting back to Mike as a question, and answered it. From the outside: Mike cuts himself
     off and the tech never gets a turn.
     The web already tracks this in isMikeSpeaking. It just had no way to tell the phone. So
     mirror it down — one place to be right instead of the twenty sites that set the flag.
     Polling is fine and deliberate: this only matters while the app is AWAKE, because a
     suspended WebView cannot be playing audio in the first place. */
  var _speakMirror = null, _lastSpoke = null;
  function mirrorSpeaking(P) {
    clearInterval(_speakMirror);
    _lastSpoke = null;
    _speakMirror = setInterval(function () {
      if (!listening) { clearInterval(_speakMirror); return; }
      var now = (typeof isMikeSpeaking !== 'undefined' && !!isMikeSpeaking);
      if (now === _lastSpoke) return;
      _lastSpoke = now;
      try { if (P.setSpeaking) P.setSpeaking({ speaking: now }); } catch (_) {}
    }, 120);
  }

  function onHeard(e) {
    clearTimeout(_deafTimer);
    report('heard', (e && e.final ? 'final: ' : 'partial: ') + String((e && e.text) || '').slice(0, 80));
    if (!e || !e.final) return;
    var text = (e.text || '').trim();
    if (text.length < 2) return;
    if (typeof isMikeSpeaking !== 'undefined' && isMikeSpeaking) return;  // don't transcribe Mike

    /* THE PHONE IS ALREADY ASKING HIM — DO NOT ASK AGAIN.
       Once the session is handed down, the native side sends this exact sentence to Mike
       itself. Letting this path also call sendChat() would ask Mike the same question twice,
       bill it twice, and play two answers over each other. So when the phone owns the call,
       this layer's only job is to draw what was said. */
    if (_nativeCall) {
      try { if (typeof appendMessage === 'function') appendMessage('user', text); } catch (_) {}
      try { if (typeof setVoiceStatus === 'function') setVoiceStatus('Sending to Mike…', text); } catch (_) {}
      try { if (window._idleResetTimer) window._idleResetTimer(); } catch (_) {}
      return;
    }

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
      if (s && s.native) _nativeBuild = String(s.native);
      report('supported', 'supported=' + s.supported + ' onDevice=' + s.onDevice + ' ready=' + s.ready);
      if (!s.supported || !s.onDevice) return false;
      var perm = await P.requestPermission();
      report('permission', 'mic=' + perm.microphone + ' speech=' + perm.speech);
      if (!perm.speech || !perm.microphone) return false;
      // LOAD THE MODEL FIRST. The native side refuses to start without it — "Speech model is
      // not loaded yet — call prepare() first" — and nothing on the web side ever called it.
      // So start() threw, mikeEarStart() caught it and returned false, and the call fell back
      // to the browser every single time. That is the whole reason Brandon kept seeing
      // "Using browser voice" on a build where the plugin was present and working.
      // First run downloads and compiles the Whisper weights for the Neural Engine, which is
      // slow exactly once; every call after this is instant.
      if (!(s.ready === true)) {
        // WAIT FOR THE WARM-UP ALREADY RUNNING — do not start a second one.
        // The simulator log settled this: the model IS downloading (base.en weights,
        // AudioEncoder, TextDecoder, straight from HuggingFace) and the whole chain works.
        // It just takes a while the first time, and Brandon tapped Call while it was still
        // pulling files. Kicking off a SECOND prepare() there would race the first one.
        // Reuse the in-flight promise so the call simply waits for the download instead of
        // giving up on it.
        try { await (_warm || (_warm = P.prepare())); report('prepared', 'ok'); }
        catch (e) { _warm = null; report('prepare_failed', (e && e.message) || String(e)); return false; }
      }
      /* HAND THE PHONE EVERYTHING IT NEEDS *BEFORE* THE SCREEN CAN LOCK.
         The token and Mike's persona live in JavaScript, and JavaScript is precisely what
         iOS stops running when the phone goes in a pocket. Handing them down at the start of
         the call is what lets the native side carry the whole conversation afterwards
         without ever waking this layer up again. This is the fix for the thing Brandon
         reported four times last night: "I close the phone and it closes the call." */
      try {
        var res = await P.setSession({
          apiBase: location.origin,
          token: (window.currentUser && window.currentUser.token) || '',
          system: (typeof AGENT_SYSTEM === 'string' && AGENT_SYSTEM) ? AGENT_SYSTEM : '',
          reset: true
        });
        _nativeCall = !!(res && res.ready);
        if (res && res.native) _nativeBuild = String(res.native);
        report('session', 'handed down: ready=' + _nativeCall
          + ' token=' + !!(window.currentUser && window.currentUser.token)
          + ' system=' + (typeof AGENT_SYSTEM === 'string' ? AGENT_SYSTEM.length : 0) + ' chars');
      } catch (e) {
        _nativeCall = false;
        /* Old build without setSession — the web path still works, it just dies on lock.
           Worth knowing which one he is on rather than guessing at the symptom. */
        report('session_failed', (e && e.message) || String(e));
      }

      if (!wired) {
        await P.addListener('heard', onHeard);
        /* Mike answered while the phone was locked. Draw it so that when he looks at the
           screen the conversation is all there, instead of a chat that silently skipped ten
           minutes of a real call. */
        await P.addListener('answered', function (e) {
          var t = (e && e.text) || '';
          if (!t) return;
          report('answered', String(t).slice(0, 80));
          try { if (typeof appendMessage === 'function') appendMessage('agent', t); } catch (_) {}
        });
        /* The native side's answer to "which silence is this" — buffer count, peak level,
           mic route, engine state. Forwarded straight to the server, never to the screen. */
        await P.addListener('diag', function (e) { report('diag', (e && e.detail) || ''); });
        /* WHY THE CALL ENDED. Brandon asked "but did you get a report for that?" about a
           hang-up I had only READ in the source. I had not. Nothing reported the call ending,
           so every explanation for it was inference dressed up as a finding. Now it says. */
        await P.addListener('ended', function (e) { report('ended', (e && e.reason) || 'unknown'); });
        wired = true;
      }
      await P.start();
      listening = true;
      report('started', 'listening');
      watchForSilence();
      mirrorSpeaking(P);
      return true;
    } catch (e) {
      report('start_failed', (e && e.message) || String(e));
      return false;
    }
  };

  window.mikeEarStop = async function () {
    var P = plugin();
    if (!P || !listening) return;
    clearTimeout(_deafTimer);
    clearInterval(_speakMirror);
    try { await P.stop(); } catch (_) {}
    listening = false;
  };

  window.mikeEarIsOn = function () { return listening; };
  /* Passive while the screen is on, attentive once it is off. See MikeEarPlugin.swift —
     iOS refuses to START recording in the background, so the mic must already be open
     before he locks. Open, and completely ignored, is the only thing Apple allows. */
  window.mikeEarAttention = async function (on) {
    var P = plugin();
    if (!P || !P.setActiveListening) return false;
    try { await P.setActiveListening({ active: !!on }); return true; } catch (e) { return false; }
  };

  /* Mike's voice, out through the earpiece, using the audio the web app already made from
     ElevenLabs. Routed natively so it ducks other audio instead of stopping it, reaches the
     AirPods he is actually wearing, and plays with the screen off. */
  /* NO WEB-SIDE PRELOAD ANY MORE — the phone handles it.
   *
   * This used to kick off the model load 1.5s after open, then had to be taught to wait
   * until Mike stopped talking because it was cutting him off mid-greeting. Both of those
   * were symptoms of doing it in the wrong place: JavaScript deciding WHEN a Neural Engine
   * compile should happen, with no idea what else the phone is doing.
   *
   * The plugin now warms itself the moment it loads, on a .utility queue, so iOS schedules
   * it around speech instead of against it. By the time he reaches for Call it is ready,
   * and he never hears it happen. Brandon: "I don't want to wait every time."
   *
   * mikeEarStart() still waits for that warm-up if he is fast enough to beat it. */

  window.mikeEarSpeak = async function (base64mp3) {
    var P = plugin();
    if (!P) return false;
    /* Return the plugin's answer, not just true/false. It reports the REAL duration of the
       audio, and the web was throwing that away and guessing the length from the file size
       instead — a guess about 2.5x too short, which opened the microphone in the middle of
       Mike's sentence and interrupted him. That is the cut-off Brandon heard on every call. */
    try { return (await P.speak({ audio: base64mp3 })) || true; } catch (e) { return false; }
  };
})();
