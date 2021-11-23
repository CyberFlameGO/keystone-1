/** @jsx jsx */

import { jsx, Box } from '@keystone-ui/core';
import { CheckboxControl } from '@keystone-ui/fields';
import { ArrowRightCircleIcon } from '@keystone-ui/icons/icons/ArrowRightCircleIcon';
import {
  getRootGraphQLFieldsFromFieldController,
  DataGetter,
  DeepNullable,
} from '../../../../admin-ui/utils';
import { useList } from '../../../../admin-ui/context';
import { CellLink } from '../../../../admin-ui/components';
import { Pagination } from '../../../../admin-ui/components/Pagination';
import { Link, useRouter } from '../../../../admin-ui/router';
import { TableHeaderRow, TableHeaderCell, TableContainer, TableBodyCell } from './Table';

import { useSelectedFields } from './useSelectedFields';

export const SortDirectionArrow = ({ direction }: { direction: 'ASC' | 'DESC' }) => {
  const size = '0.25em';
  return (
    <span
      css={{
        borderLeft: `${size} solid transparent`,
        borderRight: `${size} solid transparent`,
        borderTop: `${size} solid`,
        display: 'inline-block',
        height: 0,
        marginLeft: '0.33em',
        marginTop: '-0.125em',
        verticalAlign: 'middle',
        width: 0,
        transform: `rotate(${direction === 'DESC' ? '0deg' : '180deg'})`,
      }}
    />
  );
};

export function ListTable({
  selectedFields,
  listKey,
  itemsGetter,
  count,
  sort,
  currentPage,
  pageSize,
  selectedItems,
  onSelectedItemsChange,
  orderableFields,
}: {
  selectedFields: ReturnType<typeof useSelectedFields>;
  listKey: string;
  itemsGetter: DataGetter<DeepNullable<{ id: string; [key: string]: any }[]>>;
  count: number;
  sort: { field: string; direction: 'ASC' | 'DESC' } | null;
  currentPage: number;
  pageSize: number;
  selectedItems: ReadonlySet<string>;
  onSelectedItemsChange(selectedItems: ReadonlySet<string>): void;
  orderableFields: Set<string>;
}) {
  const list = useList(listKey);
  const { query } = useRouter();
  const shouldShowLinkIcon =
    !list.fields[selectedFields.keys().next().value].views.Cell.supportsLinkTo;
  return (
    <Box paddingBottom="xlarge">
      <TableContainer>
        <colgroup>
          <col width="30" />
          {shouldShowLinkIcon && <col width="30" />}
          {[...selectedFields].map(path => (
            <col key={path} />
          ))}
        </colgroup>
        <TableHeaderRow>
          <TableHeaderCell css={{ paddingLeft: 0 }}>
            <label
              css={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                cursor: 'pointer',
              }}
            >
              <CheckboxControl
                size="small"
                checked={selectedItems.size === itemsGetter.data?.length}
                css={{ cursor: 'default' }}
                onChange={() => {
                  const newSelectedItems = new Set<string>();
                  if (selectedItems.size !== itemsGetter.data?.length) {
                    itemsGetter.data?.forEach(item => {
                      if (item !== null && item.id !== null) {
                        newSelectedItems.add(item.id);
                      }
                    });
                  }
                  onSelectedItemsChange(newSelectedItems);
                }}
              />
            </label>
          </TableHeaderCell>
          {shouldShowLinkIcon && <TableHeaderCell />}
          {[...selectedFields].map(path => {
            const label = list.fields[path].label;
            if (!orderableFields.has(path)) {
              return <TableHeaderCell key={path}>{label}</TableHeaderCell>;
            }
            return (
              <TableHeaderCell key={path}>
                <Link
                  css={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    ':hover': { color: 'inherit' },
                  }}
                  href={{
                    query: {
                      ...query,
                      sortBy: sort?.field === path && sort.direction === 'ASC' ? `-${path}` : path,
                    },
                  }}
                >
                  {label}
                  {sort?.field === path && <SortDirectionArrow direction={sort.direction} />}
                </Link>
              </TableHeaderCell>
            );
          })}
        </TableHeaderRow>
        <tbody>
          {(itemsGetter.data ?? []).map((_, index) => {
            const itemGetter = itemsGetter.get(index);
            if (itemGetter.data === null || itemGetter.data.id === null) {
              if (itemGetter.errors) {
                return (
                  <tr css={{ color: 'red' }} key={`index:${index}`}>
                    {itemGetter.errors[0].message}
                  </tr>
                );
              }
              return null;
            }
            const itemId = itemGetter.data.id;
            return (
              <tr key={itemId || `index:${index}`}>
                <TableBodyCell>
                  <label
                    css={{
                      display: 'flex',
                      minHeight: 38,
                      alignItems: 'center',
                      justifyContent: 'start',
                    }}
                  >
                    <CheckboxControl
                      size="small"
                      checked={selectedItems.has(itemId)}
                      css={{ cursor: 'default' }}
                      onChange={() => {
                        const newSelectedItems = new Set(selectedItems);
                        if (selectedItems.has(itemId)) {
                          newSelectedItems.delete(itemId);
                        } else {
                          newSelectedItems.add(itemId);
                        }
                        onSelectedItemsChange(newSelectedItems);
                      }}
                    />
                  </label>
                </TableBodyCell>
                {shouldShowLinkIcon && (
                  <TableBodyCell>
                    <Link
                      css={{
                        textDecoration: 'none',
                        minHeight: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      href={`/${list.path}/[id]`}
                      as={`/${list.path}/${encodeURIComponent(itemId)}`}
                    >
                      <ArrowRightCircleIcon size="smallish" aria-label="Go to item" />
                    </Link>
                  </TableBodyCell>
                )}
                {[...selectedFields].map((path, i) => {
                  const field = list.fields[path];
                  let { Cell } = list.fields[path].views;
                  const itemForField: Record<string, any> = {};
                  for (const graphqlField of getRootGraphQLFieldsFromFieldController(
                    field.controller
                  )) {
                    const fieldGetter = itemGetter.get(graphqlField);
                    if (fieldGetter.errors) {
                      const errorMessage = fieldGetter.errors[0].message;
                      return (
                        <TableBodyCell css={{ color: 'red' }} key={path}>
                          {i === 0 && Cell.supportsLinkTo ? (
                            <CellLink
                              href={`/${list.path}/[id]`}
                              as={`/${list.path}/${encodeURIComponent(itemId)}`}
                            >
                              {errorMessage}
                            </CellLink>
                          ) : (
                            errorMessage
                          )}
                        </TableBodyCell>
                      );
                    }
                    itemForField[graphqlField] = fieldGetter.data;
                  }

                  return (
                    <TableBodyCell key={path}>
                      <Cell
                        field={field.controller}
                        item={itemForField}
                        linkTo={
                          i === 0 && Cell.supportsLinkTo
                            ? {
                                href: `/${list.path}/[id]`,
                                as: `/${list.path}/${encodeURIComponent(itemId)}`,
                              }
                            : undefined
                        }
                      />
                    </TableBodyCell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </TableContainer>
      <Pagination list={list} total={count} currentPage={currentPage} pageSize={pageSize} />
    </Box>
  );
}
