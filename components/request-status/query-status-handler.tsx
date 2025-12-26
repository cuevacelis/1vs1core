import type { UseQueryResult } from "@tanstack/react-query";
import ErrorBoundary from "../error/error-boundary";
import { ModalLoading } from "../modals/modal-loading";
import { NoDataFound } from "../no-data-found";
import { ErrorMessage } from "../validate/message/error-message";
import ErrorAlertComponent from "./components/error-alert-component";
import { ErrorComponent } from "./components/error-component";
import { formatErrorMessages, hasAnyData } from "./utils/query-helpers";

type LoadingType = "isLoading" | "isFetching";
type ErrorDisplayMode = "block" | "partial";

interface IQueryStatusHandlerProps {
  children?: React.ReactNode;
  queries: UseQueryResult<unknown, Error>[];
  hideLoadingModal?: boolean;
  hideNoDataMessage?: boolean;
  hideErrorMessage?: boolean;
  loadingType?: LoadingType;
  emptyStateComponent?: React.ReactNode;
  customLoadingComponent?: React.ReactNode;
  errorMode?: ErrorDisplayMode;
}

export function QueryStatusHandler({
  children,
  queries,
  hideLoadingModal = false,
  hideNoDataMessage = false,
  hideErrorMessage = false,
  loadingType = "isFetching",
  emptyStateComponent,
  customLoadingComponent,
  errorMode = "partial",
}: IQueryStatusHandlerProps) {
  const isLoading = queries.some((query) => query[loadingType]);
  const hasErrors = queries.some((query) => query.isError);

  // Filter successful queries (not in error state)
  const successfulQueries = queries.filter((query) => !query.isError);
  const hasSuccessfulQueries = successfulQueries.length > 0;
  const allSuccessfulQueriesCompleted = successfulQueries.every(
    (query) => query.isSuccess
  );

  // Check if any query has data
  const hasData = hasAnyData(queries);

  const shouldShowLoadingModal = !hideLoadingModal && isLoading;
  const loadingComponent = customLoadingComponent ?? <ModalLoading />;

  const shouldShowNoDataMessage =
    !hideNoDataMessage &&
    hasSuccessfulQueries &&
    allSuccessfulQueriesCompleted &&
    !hasData;

  const shouldBlockWithError =
    !hideErrorMessage && !isLoading && hasErrors && errorMode === "block";

  const shouldShowPartialError =
    !hideErrorMessage && !isLoading && hasErrors && errorMode === "partial";

  if (shouldShowNoDataMessage) {
    return (
      <ErrorBoundary
        fallback={
          <ErrorMessage message="Error al mostrar el contenido. Por favor, recargue la página o contacte al administrador si el problema persiste." />
        }
      >
        {emptyStateComponent ?? <NoDataFound />}
        {shouldShowLoadingModal && loadingComponent}
      </ErrorBoundary>
    );
  }

  if (shouldBlockWithError) {
    return (
      <ErrorBoundary
        fallback={
          <ErrorMessage message="Error crítico al cargar la información. Por favor, verifique su conexión a internet y recargue la página. Si el problema continúa, contacte al soporte técnico." />
        }
      >
        <ErrorComponent message={formatErrorMessages(queries)} />
        {shouldShowLoadingModal && loadingComponent}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <ErrorMessage message="Error inesperado en el componente. La aplicación encontró un problema al renderizar esta sección. Por favor, recargue la página o navegue a otra sección." />
      }
    >
      {shouldShowPartialError && (
        <ErrorAlertComponent
          className="mb-4 mt-1"
          message={formatErrorMessages(queries)}
        />
      )}

      {shouldShowLoadingModal && customLoadingComponent ? null : children}

      {shouldShowLoadingModal && loadingComponent}
    </ErrorBoundary>
  );
}
