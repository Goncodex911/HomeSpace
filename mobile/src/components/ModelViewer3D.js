import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { colors, typography } from '../theme';
import { getApiBaseUrl } from '../config';

/**
 * Build inline HTML that loads a GLB with Three.js (classic scripts — works in RN WebView).
 * Avoids ES-module model-viewer which often fails inside source={{ html }}.
 */
function buildViewerHtml(modelUrl, background) {
  // JSON.stringify safely escapes quotes, &, unicode for embedding in JS
  const urlJson = JSON.stringify(String(modelUrl));
  const bgJson = JSON.stringify(String(background || '#eeeeea'));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: ${background}; }
    #c { display: block; width: 100%; height: 100%; touch-action: none; }
    #status {
      position: absolute; left: 0; right: 0; top: 40%; text-align: center;
      font-family: system-ui, sans-serif; font-size: 13px; color: #444748;
      padding: 0 16px;
    }
    #err { color: #ba1a1a; }
  </style>
</head>
<body>
  <div id="status">Loading 3D model…</div>
  <canvas id="c"></canvas>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js"></script>
  <script>
    (function () {
      var MODEL_URL = ${urlJson};
      var BG = ${bgJson};
      var statusEl = document.getElementById('status');

      function post(type, message) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, message: message || '' }));
          }
        } catch (e) {}
      }

      function fail(msg) {
        statusEl.id = 'err';
        statusEl.textContent = msg || 'Failed to load 3D model';
        post('error', msg);
      }

      if (typeof THREE === 'undefined') {
        fail('Three.js failed to load. Check network.');
        return;
      }
      if (!THREE.OrbitControls || !THREE.GLTFLoader) {
        fail('3D loaders failed to load. Check network.');
        return;
      }

      var canvas = document.getElementById('c');
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.setClearColor(new THREE.Color(BG), 1);

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(BG);

      var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
      camera.position.set(1.8, 1.2, 2.4);

      var controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 0.4, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      var key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(3, 5, 2);
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(-2, 1, -2);
      scene.add(fill);

      function resize() {
        var w = window.innerWidth || 1;
        var h = window.innerHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
      window.addEventListener('resize', resize);
      resize();

      var loader = new THREE.GLTFLoader();
      loader.load(
        MODEL_URL,
        function (gltf) {
          var root = gltf.scene || gltf.scenes[0];
          scene.add(root);

          var box = new THREE.Box3().setFromObject(root);
          var size = box.getSize(new THREE.Vector3());
          var center = box.getCenter(new THREE.Vector3());
          root.position.sub(center);

          var maxDim = Math.max(size.x, size.y, size.z) || 1;
          var dist = maxDim * 2.2;
          camera.position.set(dist * 0.7, dist * 0.45, dist * 0.9);
          controls.target.set(0, 0, 0);
          controls.update();

          statusEl.style.display = 'none';
          post('ready');
        },
        function (xhr) {
          if (xhr && xhr.total) {
            var pct = Math.round((xhr.loaded / xhr.total) * 100);
            statusEl.textContent = 'Loading 3D model… ' + pct + '%';
          }
        },
        function (err) {
          console.error(err);
          fail('Could not load GLB. The model link may have expired or is blocked.');
        }
      );

      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    })();
  </script>
</body>
</html>`;
}

export default function ModelViewer3D({
  modelUrl,
  style,
  posterUrl,
  background = '#eeeeea',
}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');

  const viewerUrl = useMemo(() => {
    if (!modelUrl) return '';
    const baseUrl = getApiBaseUrl().replace(/\/$/, ''); // Remove trailing slash if any
    return `${baseUrl}/model-viewer?modelUrl=${encodeURIComponent(modelUrl)}&bg=${encodeURIComponent(background)}`;
  }, [modelUrl, background]);

  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') setStatus('ready');
      if (data.type === 'error') {
        setStatus('error');
        setErrorMsg(data.message || 'Load failed');
      }
    } catch (_) {}
  }, []);

  if (!modelUrl) {
    return (
      <View style={[styles.wrap, style]}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="contain" />
        ) : null}
        <Text style={styles.centerText}>No 3D model URL</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]}>
        <iframe
          title="3D Model"
          src={viewerUrl}
          style={{ width: '100%', height: '100%', border: 'none', background }}
          allow="xr-spatial-tracking; fullscreen"
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {status === 'loading' && posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.posterDim} contentFit="contain" />
      ) : null}

      <WebView
        originWhitelist={['*']}
        source={{ uri: viewerUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        allowsFullscreenVideo
        onMessage={onMessage}
        onLoadEnd={() => {
          setStatus('ready');
        }}
        onError={() => {
          setStatus('error');
          setErrorMsg('WebView failed to load');
        }}
        onHttpError={() => {
          setStatus('error');
          setErrorMsg('Network error loading viewer');
        }}
      />

      {status === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text style={styles.overlayText}>Loading 3D model…</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>3D model unavailable</Text>
          <Text style={styles.errorBody}>{errorMsg}</Text>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Linking.openURL(modelUrl).catch(() => {})}
          >
            <Text style={styles.linkBtnText}>Open model URL</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  posterDim: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,249,245,0.55)',
    gap: 10,
  },
  overlayText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  centerText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: 24,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,249,245,0.92)',
    padding: 20,
  },
  errorTitle: {
    ...typography.title,
    marginBottom: 8,
  },
  errorBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 16,
  },
  linkBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  linkBtnText: {
    ...typography.caps,
    color: colors.primary,
  },
});
