(function () {
  // Kailangan naka-setup na ang remoteSocket at remoteDeviceId
  if (!window.remoteSocket || !window.remoteDeviceId) {
    console.warn("[preview] remoteSocket or remoteDeviceId not ready, preview disabled");
    return;
  }

  var socket = window.remoteSocket;
  var deviceId = window.remoteDeviceId;

  var intervalId = null;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  function startPreview() {
    if (intervalId) {
      console.log("[preview] already running");
      return;
    }

    var video = document.getElementById("videoPreview");
    if (!video) {
      console.warn("[preview] videoPreview element not found");
      return;
    }

    console.log("[preview] starting preview streaming");

    intervalId = setInterval(function () {
      try {
        if (!video.videoWidth || !video.videoHeight) return;

        var maxWidth = 320; // bawasan kung mabagal
        var scale = Math.min(
          maxWidth / video.videoWidth,
          maxWidth / video.videoHeight
        );
        if (!scale || !isFinite(scale)) return;

        var w = Math.max(1, Math.round(video.videoWidth * scale));
        var h = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(video, 0, 0, w, h);

        var dataUrl = canvas.toDataURL("image/jpeg", 0.4);

        socket.emit("previewFrame", {
          deviceId: deviceId,
          image: dataUrl,
        });
      } catch (e) {
        console.error("[preview] error while sending frame:", e);
      }
    }, 1000); // 1 frame per second
  }

  function stopPreview() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log("[preview] stopped preview streaming");
    }
  }

  // Gawing globally available para matawag ng remote-control.js
  window.startPreview = startPreview;
  window.stopPreview = stopPreview;
})();
