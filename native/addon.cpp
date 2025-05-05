#include <napi.h>
#include <cstring>          // memset
#include "wnp.h"

#define MAKE_FUNC(name, wnp_call) \
  Napi::Value name(const Napi::CallbackInfo& info) { \
    wnp_player_t p; getActive(p);                   \
    return Napi::Number::New(info.Env(), wnp_call); \
  }

// ───────── helper: obtém player ativo ─────────
static void getActive(wnp_player_t& out) {
  std::memset(&out, 0, sizeof(out));
  out.id = -1;               // default
  wnp_get_active_player(&out);
}

// ───────── wrappers básicos ────────────────────
Napi::Value wnpInit (const Napi::CallbackInfo& info) {
  wnp_args_t a{}; a.web_port = 1234; strcpy_s(a.adapter_version, "1.0.0");
  return Napi::Number::New(info.Env(), wnp_init(&a));
}
Napi::Value wnpUninit(const Napi::CallbackInfo& info) { wnp_uninit(); return info.Env().Undefined(); }

// Controles sem parâmetro
MAKE_FUNC(tryPlayPause , wnp_try_play_pause (&p))
MAKE_FUNC(tryNext      , wnp_try_skip_next  (&p))
MAKE_FUNC(tryPrevious  , wnp_try_skip_previous(&p))
MAKE_FUNC(toggleRepeat , wnp_try_toggle_repeat(&p))
MAKE_FUNC(toggleShuffle, wnp_try_set_shuffle(&p, !p.shuffle))

// Controles com argumento numérico
template<int (*F)(wnp_player_t*, unsigned int)>
static Napi::Value numArgUint(const Napi::CallbackInfo& info) {
  auto env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) return Napi::Number::New(env, -1);
  unsigned v = info[0].As<Napi::Number>().Uint32Value();
  wnp_player_t p; getActive(p);
  return Napi::Number::New(env, F(&p, v));
}
Napi::Value trySeek   (const Napi::CallbackInfo& i) { return numArgUint<wnp_try_set_position>(i); }
Napi::Value tryVolume (const Napi::CallbackInfo& i) { return numArgUint<wnp_try_set_volume   >(i); }
Napi::Value tryRating (const Napi::CallbackInfo& i) { return numArgUint<wnp_try_set_rating   >(i); }

// Repeat explícito (0-none 1-all 2-one)
Napi::Value setRepeat(const Napi::CallbackInfo& info) {
  auto env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    return Napi::Number::New(env, -1);
  }

  int mode = info[0].As<Napi::Number>().Int32Value();

  if (mode < 0 || mode > 2) {
    printf("[⚠️] Repeat inválido ignorado: %d\n", mode);
    return Napi::Number::New(env, -1);
  }

  wnp_repeat_t r =
    mode == 2 ? WNP_REPEAT_ONE :
    mode == 1 ? WNP_REPEAT_ALL :
                WNP_REPEAT_NONE;

  wnp_player_t p;
  getActive(p);
  return Napi::Number::New(env, wnp_try_set_repeat(&p, r));
}

// info do player ativo → objeto JS
Napi::Value getActivePlayer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  wnp_player_t p; getActive(p);

  Napi::Object o = Napi::Object::New(env);
  o.Set("id", p.id);               o.Set("name",   p.name);
  o.Set("title", p.title);         o.Set("artist", p.artist);
  o.Set("album", p.album);         o.Set("cover",  p.cover);
  o.Set("state", Napi::Number::New(env, (int)p.state));
  o.Set("position", p.position);   o.Set("duration", p.duration);
  o.Set("volume", p.volume);       o.Set("repeat",  (int)p.repeat);
  o.Set("shuffle", p.shuffle);     o.Set("rating",  p.rating);
  return o;
}

// ───────── módulo ─────────────────────────────
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set("wnpInit",     Napi::Function::New(env, wnpInit));
  exports.Set("wnpUninit",   Napi::Function::New(env, wnpUninit));
  exports.Set("getActivePlayer", Napi::Function::New(env, getActivePlayer));

  exports.Set("tryPlayPause",     Napi::Function::New(env, tryPlayPause));
  exports.Set("tryNext",          Napi::Function::New(env, tryNext));
  exports.Set("tryPrevious",      Napi::Function::New(env, tryPrevious));
  exports.Set("trySeek",          Napi::Function::New(env, trySeek));
  exports.Set("tryVolume",        Napi::Function::New(env, tryVolume));
  exports.Set("tryRating",        Napi::Function::New(env, tryRating));
  exports.Set("setRepeat",        Napi::Function::New(env, setRepeat));
  exports.Set("toggleRepeat",     Napi::Function::New(env, toggleRepeat));
  exports.Set("toggleShuffle",    Napi::Function::New(env, toggleShuffle));
  return exports;
}
NODE_API_MODULE(addon, InitAll)
