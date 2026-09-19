import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer
} from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import { createPerson, deletePerson, listPersons, Person, updatePerson } from "./api";

/** A row that exists only in the grid keeps a temporary negative id until it is saved. */
interface PersonRow extends Partial<Person> {
  id: number;
  name: string;
  isNew?: boolean;
}

let temporaryId = 0;

interface EditToolbarProps {
  onAdd: () => void;
  onRefresh: () => void;
}

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides extends EditToolbarProps {}
}

function EditToolbar({ onAdd, onRefresh }: EditToolbarProps) {
  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between", p: 1 }}>
      <Button color="primary" startIcon={<AddIcon />} onClick={onAdd}>
        Добавить
      </Button>
      <Button color="inherit" startIcon={<RefreshIcon />} onClick={onRefresh}>
        Обновить
      </Button>
    </GridToolbarContainer>
  );
}

export default function PersonGrid() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const persons = await listPersons();
      setRows(persons);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleAdd = () => {
    const id = --temporaryId;
    setRows((current) => [{ id, name: "", age: undefined, address: "", work: "", isNew: true }, ...current]);
    setRowModesModel((current) => ({
      ...current,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" }
    }));
  };

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () =>
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.Edit } }));

  const handleSaveClick = (id: GridRowId) => () =>
    setRowModesModel((current) => ({ ...current, [id]: { mode: GridRowModes.View } }));

  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel((current) => ({
      ...current,
      [id]: { mode: GridRowModes.View, ignoreModifications: true }
    }));

    const row = rows.find((candidate) => candidate.id === id);
    if (row?.isNew) setRows((current) => current.filter((candidate) => candidate.id !== id));
  };

  const handleDeleteClick = (id: GridRowId) => async () => {
    const row = rows.find((candidate) => candidate.id === id);
    if (row?.isNew) {
      setRows((current) => current.filter((candidate) => candidate.id !== id));
      return;
    }
    try {
      await deletePerson(Number(id));
      setRows((current) => current.filter((candidate) => candidate.id !== id));
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  /** Called by the grid when a row leaves edit mode; the resolved row replaces the old one. */
  const processRowUpdate = async (newRow: GridRowModel<PersonRow>): Promise<PersonRow> => {
    const payload = {
      name: (newRow.name ?? "").trim(),
      age: newRow.age === undefined || newRow.age === null || Number.isNaN(newRow.age) ? null : Number(newRow.age),
      address: newRow.address ? String(newRow.address) : null,
      work: newRow.work ? String(newRow.work) : null
    };

    const saved = newRow.isNew
      ? await createPerson(payload)
      : await updatePerson(newRow.id, payload);

    setRows((current) => current.map((row) => (row.id === newRow.id ? saved : row)));
    return saved;
  };

  const columns: GridColDef<PersonRow>[] = [
    { field: "id", headerName: "ID", width: 80, valueGetter: (_value, row) => (row.isNew ? "—" : row.id) },
    { field: "name", headerName: "Имя", width: 200, editable: true },
    { field: "age", headerName: "Возраст", type: "number", width: 110, editable: true },
    { field: "address", headerName: "Адрес", width: 240, editable: true },
    { field: "work", headerName: "Работа", width: 200, editable: true },
    {
      field: "actions",
      type: "actions",
      headerName: "Действия",
      width: 120,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const inEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (inEditMode) {
          return [
            <GridActionsCellItem
              key="save"
              icon={<SaveIcon />}
              label="Сохранить"
              onClick={handleSaveClick(id)}
              color="primary"
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelIcon />}
              label="Отменить"
              onClick={handleCancelClick(id)}
              color="inherit"
            />
          ];
        }

        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Изменить"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Удалить"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />
        ];
      }
    }
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={setRowModesModel}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(cause: Error) => setError(cause.message)}
        slots={{ toolbar: EditToolbar }}
        slotProps={{ toolbar: { onAdd: handleAdd, onRefresh: reload } }}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
      />
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
