#!/usr/bin/env sh
set -eu

usage() {
  echo "Usage: $0 {check|format|test|e2e-tests|build|rtk-hook|safety-hook|setup-environment}" >&2
}

rtk_hook() {
  export RTK_CODEX_HOOK_MODE=deny
  export RTK_BIN="$(which rtk)"
  export NO_RTK_BIN="$(which NO_RTK)"
  python3 "$(git rev-parse --show-toplevel)/.codex/hooks/rtk_hook.py"
}

safety_hook() {
  python3 "$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py"
}

setup_environment() {
  if command -v rtk >/dev/null 2>&1; then
    echo "rtk already available"
  else
    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
  fi

  if command -v context-mode >/dev/null 2>&1; then
    echo "context-mode already available"
  else
    npm install -g context-mode
  fi
}

case "${1:-}" in
  check)
    npm run check
    ;;
  test)
    npm run test
    ;;
  e2e-tests)
    npm run e2e-tests
    ;;
  format)
    npm run format
    ;;
  build)
    npm run build
    ;;
  rtk-hook)
    rtk_hook
    ;;
  safety-hook)
    safety_hook
    ;;
  setup-environment)
    setup_environment
    ;;
  *)
    usage
    exit 2
    ;;
esac
