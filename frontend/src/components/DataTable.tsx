import React, { ReactNode } from 'react';
import { DataTable as PrimeDataTable, DataTableProps as PrimeDataTableProps } from 'primereact/datatable';
import { Column, ColumnProps } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useTranslation } from 'react-i18next';

export interface DataTableColumn extends Omit<ColumnProps, 'body'> {
    field: string;
    header: string;
    body?: (rowData: any) => ReactNode;
    sortable?: boolean;
    style?: React.CSSProperties;
}

interface CustomDataTableProps extends Omit<PrimeDataTableProps<any>, 'value'> {
    data: any[];
    columns: DataTableColumn[];
    loading?: boolean;
    globalFilterValue?: string;
    onGlobalFilterChange?: (value: string) => void;
    onNew?: () => void;
    newButtonLabel?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    showHeader?: boolean;
    paginator?: boolean;
    rows?: number;
    rowsPerPageOptions?: number[];
}

export const DataTable: React.FC<CustomDataTableProps> = ({
    data,
    columns,
    loading = false,
    globalFilterValue = '',
    onGlobalFilterChange,
    onNew,
    newButtonLabel,
    searchPlaceholder,
    emptyMessage,
    showHeader = true,
    paginator = true,
    rows = 10,
    rowsPerPageOptions = [5, 10, 25, 50],
    ...rest
}) => {
    const { t } = useTranslation();

    const header = showHeader ? (
        <div className="flex justify-between items-center">
            {onGlobalFilterChange && (
                <div className="relative">
                    <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <InputText
                        value={globalFilterValue}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        placeholder={searchPlaceholder || t('table.search')}
                        className="w-80 !pl-12"
                    />
                </div>
            )}
            {!onGlobalFilterChange && <div />}
            {onNew && (
                <Button
                    label={newButtonLabel || t('buttons.new')}
                    icon="pi pi-plus"
                    onClick={onNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                />
            )}
        </div>
    ) : undefined;

    return (
        <PrimeDataTable
            value={data}
            loading={loading}
            paginator={paginator}
            rows={rows}
            rowsPerPageOptions={rowsPerPageOptions}
            globalFilter={globalFilterValue}
            header={header}
            emptyMessage={emptyMessage || t('table.noResults')}
            className="p-datatable-sm"
            stripedRows
            {...(rest as any)}
        >
            {columns.map((col, index) => (
                <Column
                    key={col.field || index}
                    {...col}
                />
            ))}
        </PrimeDataTable>
    );
};

export default DataTable;
