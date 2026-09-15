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
  function plugin() {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.MikeEar) || null;
  }
  /* Available only inside the iOS shell. On the web this whole file is inert and the
     existing browser path runs exactly as before — no behaviour change for browser users. */
  window.mikeEarAvailable = function () { return !!plugin(); };

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
  window.mikeEarSpeak = async function (base64mp3) {
    var P = plugin();
    if (!P) return false;
    try { await P.speak({ audio: base64mp3 }); return true; } catch (e) { return false; }
  };
})();
