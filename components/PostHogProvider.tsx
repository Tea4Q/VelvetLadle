import { PostHogProvider } from "posthog-react-native";

export function App() {
  return (
    <PostHogProvider
      apiKey="phc_m8EjrNKBB48SJowOLM4JLctQPlrHglzs63fqvCWkz2m"
      options={{
        host: "https://us.i.posthog.com",

        // Enable session recording. Requires enabling in your project settings as well.
        // Default is false.
        enableSessionReplay: true,

        sessionReplayConfig: {
          // Whether text inputs are masked. Default is true.
          // Password inputs are always masked regardless
          maskAllTextInputs: true,

          // Whether images are masked. Default is true.
          maskAllImages: true,

          // Capture logs automatically. Default is true.
          // Android only (Native Logcat only)
          //
          // Support for remote configuration
          // in the [session replay settings](https://app.posthog.com/settings/project-replay#replay-log-capture)
          // requires SDK version 4.35.0 or higher.
          captureLog: true,

          // Whether network requests are captured in recordings. Default is true
          // Only metric-like data like speed, size, and response code are captured.
          // No data is captured from the request or response body.
          // iOS only
          //
          // Support for remote configuration
          // in the [session replay settings](https://app.posthog.com/settings/project-replay#replay-network)
          // requires SDK version 4.35.0 or higher.
          captureNetworkTelemetry: true,

          // Sample rate for session recordings. A value between 0.0 and 1.0.
          // 1.0 means 100% of sessions will be recorded. 0.5 means 50%, and so on.
          // Local config has precedence over remote config when both are set.
          // Default is undefined (all sessions are recorded).
          sampleRate: undefined,

          // Throttling delay used to reduce the number of snapshots captured
          // and reduce performance impact. Default is 1000ms
          throttleDelayMs: 1000,
        },
      }}
    >
      <RestOfApp />
    </PostHogProvider>
  );
}
