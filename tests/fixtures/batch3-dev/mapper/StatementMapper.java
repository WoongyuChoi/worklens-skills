package sample;
import java.util.List;
import org.apache.ibatis.annotations.Param;
interface StatementMapper {
    List<StatementRow> findSelected(@Param("ids") List<String> ids);
    StatementRow findOne(String statementId);
    int countByStatus(@Param("status") String status);
}
