/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 高德 JS API Key（Web 端） */
  readonly VITE_AMAP_KEY?: string;
  /** 高德安全密钥 securityJsCode，与 Key 配对，须在加载脚本前写入 _AMapSecurityConfig */
  readonly VITE_AMAP_SECURITY_JS_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
