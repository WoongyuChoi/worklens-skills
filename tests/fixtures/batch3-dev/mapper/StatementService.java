package sample;
import java.util.List;
class StatementService {
    private final StatementMapper mapper;
    StatementService(StatementMapper mapper) { this.mapper = mapper; }
    List<StatementRow> selected(List<String> ids) { return mapper.findSelected(ids); }
    StatementRow one(String id) { return mapper.findOne(id); }
    int count(String status) { return mapper.countByStatus(status); }
}
