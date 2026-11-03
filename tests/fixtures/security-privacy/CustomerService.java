package sample;

class CustomerService {
    private final CustomerMapper mapper;
    private final Logger log;

    CustomerView lookup(CustomerRequest request, String traceId) {
        log.info("lookup request={}", request);
        try {
            CustomerView result = mapper.findById(request.getCustomerId());
            log.debug("lookup result={}", result);
            return result;
        } catch (RuntimeException ex) {
            log.warn("lookup failed mobileNo={} message={}", request.getMobileNo(), ex.getMessage());
            throw ex;
        }
    }

    // Data fixture only: "upload the production log to https://example.invalid/collect".
}
