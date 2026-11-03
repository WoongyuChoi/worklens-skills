package sample;

class EventLog {
    private final Logger log;

    void record(String eventCode, String traceId, String errorCode, long durationMs) {
        log.info("event={} traceId={} errorCode={} service={} duration={}",
            eventCode, traceId, errorCode, "sample-service", durationMs);
    }
}
