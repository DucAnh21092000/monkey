import { Button, Drawer, Form, Select, Space } from "antd";

const FilterDraw = (props) => {
  const {
    openFilter,
    setOpenFilter,
    draftFilters,
    setDraftFilters,
    defaultFilters,
    setFilters,
    classFilters,
    reportOptions,
    testResultFilters,
  } = props;

  return (
    <div>
      <Drawer
        title="Filter Students"
        width={400}
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        footer={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setFilters(draftFilters);
                setOpenFilter(false);
              }}>
              Apply
            </Button>

            <Button
              onClick={() => {
                setDraftFilters(defaultFilters);
              }}>
              Clear
            </Button>

            <Button onClick={() => setOpenFilter(false)}>Close</Button>
          </Space>
        }>
        <Form layout="vertical">
          <Form.Item label="Class">
            <Select
              mode="multiple"
              maxTagCount="responsive"
              allowClear
              placeholder="Chọn lớp"
              options={classFilters}
              value={draftFilters.class}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  class: value,
                }))
              }
            />
          </Form.Item>

          <Form.Item label="Report">
            <Select
              mode="multiple"
              maxTagCount="responsive"
              allowClear
              placeholder="Chọn report"
              options={reportOptions}
              value={draftFilters.report}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  report: value,
                }))
              }
            />
          </Form.Item>

          <Form.Item label="Test Result">
            <Select
              mode="multiple"
              maxTagCount="responsive"
              allowClear
              placeholder="Chọn kết quả"
              options={testResultFilters}
              value={draftFilters.testResult}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  testResult: value,
                }))
              }
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default FilterDraw;
