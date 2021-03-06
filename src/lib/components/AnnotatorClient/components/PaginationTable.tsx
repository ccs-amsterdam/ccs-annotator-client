import React, { useState, useEffect } from "react";
import { Container, Pagination, Table, Icon, Search } from "semantic-ui-react";
import { ButtonComponentProps, Column, RowObj, SetState } from "../../../types";
import Backend from "../classes/Backend";

const headerStyle = {
  color: "white",
  background: "#2185d0",
  borderBottom: "1px solid black",
  borderTop: "1px solid black",
  borderRadius: "0px",
  paddingTop: "5px",
  paddingBottom: "5px",
};
const headerStyleLeft = {
  ...headerStyle,
  borderTopLeftRadius: "5px",
  borderBottomLeftRadius: "5px",
  borderLeft: "1px solid black",
};
const headerStyleRight = {
  ...headerStyle,
  borderTopRightRadius: "5px",
  borderBottomRightRadius: "5px",
  borderRight: "1px solid black",
};
const rowStyle = {
  border: "none",
  borderBottom: "none",
  height: "30px",
};
const footerStyle = {
  color: "black",
  background: "transparent",
  //borderTop: "2px solid black",
  borderTop: "0px",
  borderRadius: "0px",
  padding: "10px 0px 5px 0px",
  textAlign: "center",
};

interface PaginationTableProps {
  data: RowObj[];
  setFullData: SetState<RowObj[]>;
  columns: Column[];
  pages: number;
  pageChange: (value: number) => void;
  onClick: (value: RowObj) => void;
  buttons: React.FC<ButtonComponentProps> | React.FC<ButtonComponentProps>[];
  backend: Backend;
  setSearch: SetState<string>;
  isActive: (rowObj: any) => boolean;
}

/**
 * A nice table with pagination
 * @param {array} data an Array with data for a single page
 * @param {array} columns an Array with objects indicating which columns to show and how
 * @param {int} pages the number of pages
 * @param {function} pageChange the function to perform on pagechange. Gets pageindex as an argument, and should update data
 * @returns
 */
const PaginationTable = ({
  data,
  setFullData,
  columns,
  pages,
  pageChange,
  onClick,
  buttons,
  backend,
  setSearch,
  isActive,
}: PaginationTableProps) => {
  const createHeaderRow = (data: RowObj, columns: Column[]) => {
    return columns.map((col, i) => {
      let style = headerStyle;
      if (i === 0 && !buttons) style = headerStyleLeft;
      if (i === columns.length - 1) style = headerStyleRight;
      return (
        <Table.HeaderCell key={i} width={col.width || null} style={style}>
          <span>{col.label || col.name}</span>
        </Table.HeaderCell>
      );
    });
  };

  const createBodyRows = (data: RowObj[]) => {
    return data.map((rowObj, i) => {
      return (
        <Table.Row
          key={i}
          active={isActive ? isActive(rowObj) : false}
          style={{ cursor: onClick ? "pointer" : "default" }}
          onClick={() => (onClick ? onClick(rowObj) : null)}
        >
          {createRowCells(rowObj)}
        </Table.Row>
      );
    });
  };

  const createRowCells = (rowObj: RowObj) => {
    let cells = columns.map((column, i) => {
      if (column.hide) return null;

      let content;
      if (column.f) {
        content = column.f(rowObj);
      } else {
        content = rowObj ? rowObj[column.name] : null;
      }
      if (column.date && content && content !== "NEW") {
        content = new Date(content);
        content = content.toISOString().slice(0, 19).replace(/T/g, " ");
      }
      return (
        <Table.Cell key={i} style={rowStyle}>
          <span title={column.title ? content : null}>{content}</span>
        </Table.Cell>
      );
    });
    if (buttons) {
      const buttonsArray = Array.isArray(buttons) ? buttons : [buttons];
      cells = [
        <Table.Cell key={"button." + rowObj.id} style={{ rowStyle, padding: "0px !important" }}>
          {buttonsArray.map((ButtonComponent: React.FC<ButtonComponentProps>, i) => (
            <ButtonComponent
              key={rowObj.id + "." + i}
              row={rowObj}
              backend={backend}
              setData={setFullData}
              style={{ padding: "2px" }}
            />
          ))}
        </Table.Cell>,
        ...cells,
      ];
    }
    return cells;
  };
  //if (data.length < 1) return null;

  const nbuttons = Array.isArray(buttons) ? buttons.length : 1;

  return (
    <Container>
      <Table unstackable selectable fixed compact="very" size="small" style={{ border: "none" }}>
        <Table.Header>
          <Table.Row>
            {buttons ? (
              <Table.HeaderCell key="buttons" widths={nbuttons * 2} style={headerStyleLeft} />
            ) : null}
            {createHeaderRow(data, columns)}
          </Table.Row>
        </Table.Header>
        <Table.Body>{createBodyRows(data)}</Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell
              colSpan={buttons ? columns.length + 1 : columns.length}
              style={footerStyle}
            >
              <FooterContent pages={pages} pageChange={pageChange} setSearch={setSearch} />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Container>
  );
};

interface FooterContentProps {
  pages: number;
  pageChange: (value: number) => void;
  setSearch: SetState<string>;
}

const FooterContent = ({ pages, pageChange, setSearch }: FooterContentProps) => {
  const [loading, setLoading] = useState(false);
  const [delayedSearch, setDelayedSearch] = useState("");

  useEffect(() => {
    if (delayedSearch !== "") setLoading(true);
    const timer = setTimeout(() => {
      setSearch(delayedSearch);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [delayedSearch, setSearch]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
      <Search
        showNoResults={false}
        size="small"
        icon="search"
        loading={loading}
        style={{ display: "inline-flex", borderRadius: "10px" }}
        onSearchChange={(e, d) => setDelayedSearch(d.value)}
      />
      <Pagination
        size="mini"
        boundaryRange={1}
        siblingRange={1}
        ellipsisItem={{
          content: <Icon name="ellipsis horizontal" />,
          icon: true,
        }}
        firstItem={{
          content: <Icon name="angle double left" />,
          icon: true,
        }}
        lastItem={{
          content: <Icon name="angle double right" />,
          icon: true,
        }}
        prevItem={{ content: <Icon name="angle left" />, icon: true }}
        nextItem={{
          content: <Icon name="angle right" />,
          icon: true,
        }}
        pointing
        secondary
        defaultActivePage={1}
        totalPages={pages}
        onPageChange={(e, d) => pageChange(Number(d.activePage))}
        style={{ padding: "0", fontSize: "0.9em" }}
      ></Pagination>
    </div>
  );
};

export default PaginationTable;
