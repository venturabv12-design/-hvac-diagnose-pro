/* MIKE IN THE EAR — the web half.
 *
 * The phone lends its ears (plugins/mike-ear). Mike's brain stays exactly where it already
 * is, on trazermike.io. This file is the wire between them, and it is deliberately the only
 * place that decides WHEN Mike is allowed to speak.
 *
 * WHY THAT MATTERS MORE THAN THE LISTENING:
 * A coach who talks constantly is worse than no coach. The tech is in someone's basement
 * with a customer watching him. If Mike narrates, the tech pulls the AirPod out and never
 * puts it back. So the default is SILENCE, and Mike earns every interruption.
 */
(function () {
  if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.MikeEar) return;
  var Ear = window.Capacitor.Plugins.MikeEar;

  var on = false;
  var buffer = [];          // recent final lines — the conversation so far
  var lastSpoke = 0;        // when Mike last said something, so he cannot chatter
  var thinking = false;     // one request in flight at a time
  var MIN_GAP_MS = 12000;   // Mike stays quiet at least this long between interruptions

  // WHEN MIKE IS ALLOWED TO SPEAK. Three cases, and nothing else:
  //  1. the tech asks him directly ("Mike, ...")
  //  2. the customer raises an objection the tech is about to fumble
  //  3. the tech says something factually dangerous or wrong about the equipment
  // Everything else, he listens and says nothing.
  var DIRECT = /\b(mike|hey mike|yo mike)\b/i;
  var OBJECTION = /\b(too (expensive|much)|can'?t afford|think about it|get another quote|shop around|why so much|out of my budget|is it worth it|cheaper)\b/i;

  function shouldSpeak(text) {
    if (Date.now() - lastSpoke < MIN_GAP_MS) return null;
    if (DIRECT.test(text)) return 'direct';
    if (OBJECTION.test(text)) return 'objection';
    return null;
  }

  async function ask(reason, heard) {
    if (thinking) return;
    thinking = true;
    try {
      var context = buffer.slice(-8).join('\n');
      // Mike gets told he is IN THE ROOM. That changes the answer completely — it has to be
      // sayable out loud in one breath, not a page he reads later.
      var directive = reason === 'objection'
        ? 'The CUSTOMER just raised a price objection and the tech is standing right there. Give him the exact words to say back. Two sentences maximum. No preamble, no "you could say" — just the words.'
        : 'The tech asked you something out loud mid-job. Answer in two sentences he can act on immediately. No lists, no headings — this is being spoken into his ear.';
      var r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: (typeof AGENT_SYSTEM === 'string' ? AGENT_SYSTEM : '')
                + (typeof buildKnowledgeContext === 'function' ? buildKnowledgeContext() : '')
                + '\n\nEARPIECE MODE — YOU ARE IN THE ROOM.\n' + directive
                + '\nHe cannot read. He cannot scroll. Anything longer than two sentences is worse than saying nothing.',
          messages: [{ role: 'user', content: 'Conversation so far:\n' + context + '\n\nJust heard: ' + heard }],
          max_tokens: 120,
          token: (window.currentUser && window.currentUser.token) || null
        })
      });
      var d = await r.json();
      var say = d.response || '';
      if (!say) return;

      // One voice, made in one place. Reuse the same ElevenLabs route the app already uses
      // rather than growing a second Mike that sounds subtly different.
      var t = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: say })
      });
      if (!t.ok) return;
      var buf = await t.arrayBuffer();
      var bin = ''; var bytes = new Uint8Array(buf);
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      await Ear.speak({ audio: btoa(bin) });
      lastSpoke = Date.now();
      if (typeof appendMessage === 'function') appendMessage('agent', say);
    } catch (e) {
      // A failed coach is silent, never a crash mid-job.
    } finally {
      thinking = false;
    }
  }

  window.mikeEarStart = async function () {
    var s = await Ear.isSupported();
    if (!s.supported || !s.onDevice) {
      if (typeof showToast === 'function') showToast('This phone can’t transcribe privately on-device, so Mike won’t listen.', 'warning', 4000);
      return false;
    }
    var p = await Ear.requestPermission();
    if (!p.speech || !p.microphone) {
      if (typeof showToast === 'function') showToast('Mike needs the mic and speech permission to ride along.', 'warning', 4000);
      return false;
    }
    await Ear.addListener('heard', function (e) {
      if (!e.final) return;                    // act on complete thoughts, not half sentences
      var text = (e.text || '').trim();
      if (text.length < 4) return;
      buffer.push(text);
      if (buffer.length > 40) buffer.shift();
      var reason = shouldSpeak(text);
      if (reason) ask(reason, text);
    });
    await Ear.start();
    on = true;
    if (typeof showToast === 'function') showToast('Mike’s listening. Put your phone away.', 'success', 3000);
    return true;
  };

  window.mikeEarStop = async function () {
    if (!on) return;
    await Ear.stop(); on = false; buffer = [];
    if (typeof showToast === 'function') showToast('Mike stopped listening.', 'info', 2500);
  };

  window.mikeEarIsOn = function () { return on; };
})();
