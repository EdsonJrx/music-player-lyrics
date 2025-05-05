{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cpp" ],
      "include_dirs": [
        "<!(node -p \"require('path').dirname(require.resolve('node-addon-api/package.json'))\")",
        "<!(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ],
      "libraries": [
        "../libwnp.lib"
      ],
      "link_settings": {
        "libraries": [
          "../libwnp.lib"
        ]
      }
    }
  ]
}
