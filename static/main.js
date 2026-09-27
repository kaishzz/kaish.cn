layer.config({
  extend: "kzhomepage/style.css", //加载扩展样式
  skin: "layer-ext-kzhomepage",
});

const openNavPopup = function (btn) {
  const rawContent = btn.attr("data-href");
  const content = rawContent.startsWith("//")
    ? `${window.location.protocol}${rawContent}`
    : rawContent;
  const title = btn.attr("data-title");

  layer.open({
    type: 1,
    title: title,
    shadeClose: false,
    anim: 4,
    closeBtn: 2,
    isOutAnim: false,
    area: ["80%", "90%"],
    content: '<div class="kz-pop-frame-shell"></div>',
    success: function (layero) {
      const contentBox = layero.find(".layui-layer-content");
      const frameShell = layero.find(".kz-pop-frame-shell");
      const iframe = $(
        '<iframe class="kz-pop-frame" scrolling="auto" allowtransparency="true" frameborder="0"></iframe>'
      );

      contentBox.css({
        padding: 0,
        overflow: "hidden",
      });
      frameShell.css({
        width: "100%",
        height: "100%",
      });
      iframe.css({
        display: "block",
        width: "100%",
        height: "100%",
        border: "none",
      });

      // Apply sandbox before navigation so third-party pages cannot replace the top window
      iframe.attr("sandbox", "allow-forms allow-scripts allow-same-origin");
      iframe.attr("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.attr("title", title);

      frameShell.append(iframe);
      iframe.attr("src", content);
    },
  });
};

// Nav buttons (touch + click, deduplicated for mobile browsers)
let lastTouchAt = 0;
$(document).on("touchend click", ".kz-nav-btn", function (event) {
  if (event.type === "touchend") {
    lastTouchAt = Date.now();
    event.preventDefault();
  } else if (Date.now() - lastTouchAt < 500) {
    return;
  }

  event.stopPropagation();
  openNavPopup($(this));
});

$.ajax({
  url: meting_music_api,
  data: {
    server: music_server,
    type: music_type,
    id: music_id,
  },
  dataType: "json",
  success: function (audio) {
    const bindVolumeDragFix = function (ap) {
      if (!ap || !ap.template || !ap.template.volumeBarWrap || !ap.template.volumeBar) {
        return;
      }

      const volumeBarWrap = ap.template.volumeBarWrap;
      const volumeBar = ap.template.volumeBar;

      const getClientY = function (event) {
        if (event.touches && event.touches[0]) {
          return event.touches[0].clientY;
        }
        if (event.changedTouches && event.changedTouches[0]) {
          return event.changedTouches[0].clientY;
        }
        return event.clientY;
      };

      const setVolumeByEvent = function (event) {
        const clientY = getClientY(event);
        if (typeof clientY !== "number") {
          return;
        }

        const rect = volumeBar.getBoundingClientRect();
        if (!rect.height) {
          return;
        }

        let percentage = (rect.bottom - clientY) / rect.height;
        percentage = Math.max(0, Math.min(1, percentage));
        ap.volume(percentage);
      };

      const onMove = function (event) {
        event.preventDefault();
        setVolumeByEvent(event);
      };

      const onEnd = function (event) {
        setVolumeByEvent(event);
        volumeBarWrap.classList.remove("aplayer-volume-bar-wrap-active");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
      };

      const onStart = function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        volumeBarWrap.classList.add("aplayer-volume-bar-wrap-active");
        setVolumeByEvent(event);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
      };

      volumeBarWrap.addEventListener("mousedown", onStart, true);
      volumeBarWrap.addEventListener("touchstart", onStart, { capture: true, passive: false });
    };

    const ap = new APlayer({
      container:
        music_fixed === false
          ? document.getElementById("aplayer-inner")
          : document.getElementById("aplayer-fixed"),
      audio: audio,
      fixed: music_fixed === false ? false : true,
      autoplay: music_autoplay,
      order: music_order,
      listFolded: true,
      volume: music_volume,
      mini: music_fixed === true ? true : music_mini,
      lrcType: 3,
      preload: "auto",
      loop: music_loop,
    });

    bindVolumeDragFix(ap);
  },
});
