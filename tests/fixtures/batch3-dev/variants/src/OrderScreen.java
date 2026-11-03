class OrderScreen {
    boolean selected(String rowId, String selectedId) {
        return rowId.equals(selectedId);
    }
    boolean firstPage(int page) { return page == 1; }
}
