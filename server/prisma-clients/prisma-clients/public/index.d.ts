
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model tenants
 * 
 */
export type tenants = $Result.DefaultSelection<Prisma.$tenantsPayload>
/**
 * Model employee_door_tasks
 * 
 */
export type employee_door_tasks = $Result.DefaultSelection<Prisma.$employee_door_tasksPayload>
/**
 * Model tenant_telegram_users
 * 
 */
export type tenant_telegram_users = $Result.DefaultSelection<Prisma.$tenant_telegram_usersPayload>
/**
 * Model notifications_outbox
 * 
 */
export type notifications_outbox = $Result.DefaultSelection<Prisma.$notifications_outboxPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const NotificationSourceType: {
  face_pass: 'face_pass',
  anpr_pass: 'anpr_pass'
};

export type NotificationSourceType = (typeof NotificationSourceType)[keyof typeof NotificationSourceType]

}

export type NotificationSourceType = $Enums.NotificationSourceType

export const NotificationSourceType: typeof $Enums.NotificationSourceType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Tenants
 * const tenants = await prisma.tenants.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Tenants
   * const tenants = await prisma.tenants.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.tenants`: Exposes CRUD operations for the **tenants** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenants
    * const tenants = await prisma.tenants.findMany()
    * ```
    */
  get tenants(): Prisma.tenantsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.employee_door_tasks`: Exposes CRUD operations for the **employee_door_tasks** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Employee_door_tasks
    * const employee_door_tasks = await prisma.employee_door_tasks.findMany()
    * ```
    */
  get employee_door_tasks(): Prisma.employee_door_tasksDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenant_telegram_users`: Exposes CRUD operations for the **tenant_telegram_users** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenant_telegram_users
    * const tenant_telegram_users = await prisma.tenant_telegram_users.findMany()
    * ```
    */
  get tenant_telegram_users(): Prisma.tenant_telegram_usersDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notifications_outbox`: Exposes CRUD operations for the **notifications_outbox** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications_outboxes
    * const notifications_outboxes = await prisma.notifications_outbox.findMany()
    * ```
    */
  get notifications_outbox(): Prisma.notifications_outboxDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.14.0
   * Query Engine version: 717184b7b35ea05dfa71a3236b7af656013e1e49
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    tenants: 'tenants',
    employee_door_tasks: 'employee_door_tasks',
    tenant_telegram_users: 'tenant_telegram_users',
    notifications_outbox: 'notifications_outbox'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "tenants" | "employee_door_tasks" | "tenant_telegram_users" | "notifications_outbox"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      tenants: {
        payload: Prisma.$tenantsPayload<ExtArgs>
        fields: Prisma.tenantsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenantsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenantsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          findFirst: {
            args: Prisma.tenantsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenantsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          findMany: {
            args: Prisma.tenantsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          create: {
            args: Prisma.tenantsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          createMany: {
            args: Prisma.tenantsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenantsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          delete: {
            args: Prisma.tenantsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          update: {
            args: Prisma.tenantsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          deleteMany: {
            args: Prisma.tenantsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenantsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenantsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          upsert: {
            args: Prisma.tenantsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          aggregate: {
            args: Prisma.TenantsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenants>
          }
          groupBy: {
            args: Prisma.tenantsGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantsGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenantsCountArgs<ExtArgs>
            result: $Utils.Optional<TenantsCountAggregateOutputType> | number
          }
        }
      }
      employee_door_tasks: {
        payload: Prisma.$employee_door_tasksPayload<ExtArgs>
        fields: Prisma.employee_door_tasksFieldRefs
        operations: {
          findUnique: {
            args: Prisma.employee_door_tasksFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.employee_door_tasksFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          findFirst: {
            args: Prisma.employee_door_tasksFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.employee_door_tasksFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          findMany: {
            args: Prisma.employee_door_tasksFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>[]
          }
          create: {
            args: Prisma.employee_door_tasksCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          createMany: {
            args: Prisma.employee_door_tasksCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.employee_door_tasksCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>[]
          }
          delete: {
            args: Prisma.employee_door_tasksDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          update: {
            args: Prisma.employee_door_tasksUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          deleteMany: {
            args: Prisma.employee_door_tasksDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.employee_door_tasksUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.employee_door_tasksUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>[]
          }
          upsert: {
            args: Prisma.employee_door_tasksUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$employee_door_tasksPayload>
          }
          aggregate: {
            args: Prisma.Employee_door_tasksAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmployee_door_tasks>
          }
          groupBy: {
            args: Prisma.employee_door_tasksGroupByArgs<ExtArgs>
            result: $Utils.Optional<Employee_door_tasksGroupByOutputType>[]
          }
          count: {
            args: Prisma.employee_door_tasksCountArgs<ExtArgs>
            result: $Utils.Optional<Employee_door_tasksCountAggregateOutputType> | number
          }
        }
      }
      tenant_telegram_users: {
        payload: Prisma.$tenant_telegram_usersPayload<ExtArgs>
        fields: Prisma.tenant_telegram_usersFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenant_telegram_usersFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenant_telegram_usersFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          findFirst: {
            args: Prisma.tenant_telegram_usersFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenant_telegram_usersFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          findMany: {
            args: Prisma.tenant_telegram_usersFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>[]
          }
          create: {
            args: Prisma.tenant_telegram_usersCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          createMany: {
            args: Prisma.tenant_telegram_usersCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenant_telegram_usersCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>[]
          }
          delete: {
            args: Prisma.tenant_telegram_usersDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          update: {
            args: Prisma.tenant_telegram_usersUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          deleteMany: {
            args: Prisma.tenant_telegram_usersDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenant_telegram_usersUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenant_telegram_usersUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>[]
          }
          upsert: {
            args: Prisma.tenant_telegram_usersUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_telegram_usersPayload>
          }
          aggregate: {
            args: Prisma.Tenant_telegram_usersAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenant_telegram_users>
          }
          groupBy: {
            args: Prisma.tenant_telegram_usersGroupByArgs<ExtArgs>
            result: $Utils.Optional<Tenant_telegram_usersGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenant_telegram_usersCountArgs<ExtArgs>
            result: $Utils.Optional<Tenant_telegram_usersCountAggregateOutputType> | number
          }
        }
      }
      notifications_outbox: {
        payload: Prisma.$notifications_outboxPayload<ExtArgs>
        fields: Prisma.notifications_outboxFieldRefs
        operations: {
          findUnique: {
            args: Prisma.notifications_outboxFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.notifications_outboxFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          findFirst: {
            args: Prisma.notifications_outboxFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.notifications_outboxFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          findMany: {
            args: Prisma.notifications_outboxFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>[]
          }
          create: {
            args: Prisma.notifications_outboxCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          createMany: {
            args: Prisma.notifications_outboxCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.notifications_outboxCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>[]
          }
          delete: {
            args: Prisma.notifications_outboxDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          update: {
            args: Prisma.notifications_outboxUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          deleteMany: {
            args: Prisma.notifications_outboxDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.notifications_outboxUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.notifications_outboxUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>[]
          }
          upsert: {
            args: Prisma.notifications_outboxUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$notifications_outboxPayload>
          }
          aggregate: {
            args: Prisma.Notifications_outboxAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotifications_outbox>
          }
          groupBy: {
            args: Prisma.notifications_outboxGroupByArgs<ExtArgs>
            result: $Utils.Optional<Notifications_outboxGroupByOutputType>[]
          }
          count: {
            args: Prisma.notifications_outboxCountArgs<ExtArgs>
            result: $Utils.Optional<Notifications_outboxCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    tenants?: tenantsOmit
    employee_door_tasks?: employee_door_tasksOmit
    tenant_telegram_users?: tenant_telegram_usersOmit
    notifications_outbox?: notifications_outboxOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TenantsCountOutputType
   */

  export type TenantsCountOutputType = {
    telegram_users: number
    door_tasks: number
  }

  export type TenantsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    telegram_users?: boolean | TenantsCountOutputTypeCountTelegram_usersArgs
    door_tasks?: boolean | TenantsCountOutputTypeCountDoor_tasksArgs
  }

  // Custom InputTypes
  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantsCountOutputType
     */
    select?: TenantsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountTelegram_usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_telegram_usersWhereInput
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountDoor_tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: employee_door_tasksWhereInput
  }


  /**
   * Models
   */

  /**
   * Model tenants
   */

  export type AggregateTenants = {
    _count: TenantsCountAggregateOutputType | null
    _avg: TenantsAvgAggregateOutputType | null
    _sum: TenantsSumAggregateOutputType | null
    _min: TenantsMinAggregateOutputType | null
    _max: TenantsMaxAggregateOutputType | null
  }

  export type TenantsAvgAggregateOutputType = {
    id: number | null
  }

  export type TenantsSumAggregateOutputType = {
    id: number | null
  }

  export type TenantsMinAggregateOutputType = {
    id: number | null
    name: string | null
    subdomain: string | null
    schema: string | null
  }

  export type TenantsMaxAggregateOutputType = {
    id: number | null
    name: string | null
    subdomain: string | null
    schema: string | null
  }

  export type TenantsCountAggregateOutputType = {
    id: number
    name: number
    subdomain: number
    schema: number
    modules: number
    _all: number
  }


  export type TenantsAvgAggregateInputType = {
    id?: true
  }

  export type TenantsSumAggregateInputType = {
    id?: true
  }

  export type TenantsMinAggregateInputType = {
    id?: true
    name?: true
    subdomain?: true
    schema?: true
  }

  export type TenantsMaxAggregateInputType = {
    id?: true
    name?: true
    subdomain?: true
    schema?: true
  }

  export type TenantsCountAggregateInputType = {
    id?: true
    name?: true
    subdomain?: true
    schema?: true
    modules?: true
    _all?: true
  }

  export type TenantsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenants to aggregate.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenants
    **/
    _count?: true | TenantsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TenantsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TenantsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantsMaxAggregateInputType
  }

  export type GetTenantsAggregateType<T extends TenantsAggregateArgs> = {
        [P in keyof T & keyof AggregateTenants]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenants[P]>
      : GetScalarType<T[P], AggregateTenants[P]>
  }




  export type tenantsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenantsWhereInput
    orderBy?: tenantsOrderByWithAggregationInput | tenantsOrderByWithAggregationInput[]
    by: TenantsScalarFieldEnum[] | TenantsScalarFieldEnum
    having?: tenantsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantsCountAggregateInputType | true
    _avg?: TenantsAvgAggregateInputType
    _sum?: TenantsSumAggregateInputType
    _min?: TenantsMinAggregateInputType
    _max?: TenantsMaxAggregateInputType
  }

  export type TenantsGroupByOutputType = {
    id: number
    name: string
    subdomain: string
    schema: string
    modules: string[]
    _count: TenantsCountAggregateOutputType | null
    _avg: TenantsAvgAggregateOutputType | null
    _sum: TenantsSumAggregateOutputType | null
    _min: TenantsMinAggregateOutputType | null
    _max: TenantsMaxAggregateOutputType | null
  }

  type GetTenantsGroupByPayload<T extends tenantsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantsGroupByOutputType[P]>
            : GetScalarType<T[P], TenantsGroupByOutputType[P]>
        }
      >
    >


  export type tenantsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    subdomain?: boolean
    schema?: boolean
    modules?: boolean
    telegram_users?: boolean | tenants$telegram_usersArgs<ExtArgs>
    door_tasks?: boolean | tenants$door_tasksArgs<ExtArgs>
    _count?: boolean | TenantsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    subdomain?: boolean
    schema?: boolean
    modules?: boolean
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    subdomain?: boolean
    schema?: boolean
    modules?: boolean
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectScalar = {
    id?: boolean
    name?: boolean
    subdomain?: boolean
    schema?: boolean
    modules?: boolean
  }

  export type tenantsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "subdomain" | "schema" | "modules", ExtArgs["result"]["tenants"]>
  export type tenantsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    telegram_users?: boolean | tenants$telegram_usersArgs<ExtArgs>
    door_tasks?: boolean | tenants$door_tasksArgs<ExtArgs>
    _count?: boolean | TenantsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type tenantsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type tenantsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $tenantsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenants"
    objects: {
      telegram_users: Prisma.$tenant_telegram_usersPayload<ExtArgs>[]
      door_tasks: Prisma.$employee_door_tasksPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      subdomain: string
      schema: string
      modules: string[]
    }, ExtArgs["result"]["tenants"]>
    composites: {}
  }

  type tenantsGetPayload<S extends boolean | null | undefined | tenantsDefaultArgs> = $Result.GetResult<Prisma.$tenantsPayload, S>

  type tenantsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenantsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantsCountAggregateInputType | true
    }

  export interface tenantsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenants'], meta: { name: 'tenants' } }
    /**
     * Find zero or one Tenants that matches the filter.
     * @param {tenantsFindUniqueArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenantsFindUniqueArgs>(args: SelectSubset<T, tenantsFindUniqueArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenants that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenantsFindUniqueOrThrowArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenantsFindUniqueOrThrowArgs>(args: SelectSubset<T, tenantsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindFirstArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenantsFindFirstArgs>(args?: SelectSubset<T, tenantsFindFirstArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenants that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindFirstOrThrowArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenantsFindFirstOrThrowArgs>(args?: SelectSubset<T, tenantsFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenants
     * const tenants = await prisma.tenants.findMany()
     * 
     * // Get first 10 Tenants
     * const tenants = await prisma.tenants.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantsWithIdOnly = await prisma.tenants.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends tenantsFindManyArgs>(args?: SelectSubset<T, tenantsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenants.
     * @param {tenantsCreateArgs} args - Arguments to create a Tenants.
     * @example
     * // Create one Tenants
     * const Tenants = await prisma.tenants.create({
     *   data: {
     *     // ... data to create a Tenants
     *   }
     * })
     * 
     */
    create<T extends tenantsCreateArgs>(args: SelectSubset<T, tenantsCreateArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenants.
     * @param {tenantsCreateManyArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenants = await prisma.tenants.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenantsCreateManyArgs>(args?: SelectSubset<T, tenantsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenants and returns the data saved in the database.
     * @param {tenantsCreateManyAndReturnArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenants = await prisma.tenants.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenants and only return the `id`
     * const tenantsWithIdOnly = await prisma.tenants.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenantsCreateManyAndReturnArgs>(args?: SelectSubset<T, tenantsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenants.
     * @param {tenantsDeleteArgs} args - Arguments to delete one Tenants.
     * @example
     * // Delete one Tenants
     * const Tenants = await prisma.tenants.delete({
     *   where: {
     *     // ... filter to delete one Tenants
     *   }
     * })
     * 
     */
    delete<T extends tenantsDeleteArgs>(args: SelectSubset<T, tenantsDeleteArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenants.
     * @param {tenantsUpdateArgs} args - Arguments to update one Tenants.
     * @example
     * // Update one Tenants
     * const tenants = await prisma.tenants.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenantsUpdateArgs>(args: SelectSubset<T, tenantsUpdateArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenants.
     * @param {tenantsDeleteManyArgs} args - Arguments to filter Tenants to delete.
     * @example
     * // Delete a few Tenants
     * const { count } = await prisma.tenants.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenantsDeleteManyArgs>(args?: SelectSubset<T, tenantsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenants
     * const tenants = await prisma.tenants.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenantsUpdateManyArgs>(args: SelectSubset<T, tenantsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants and returns the data updated in the database.
     * @param {tenantsUpdateManyAndReturnArgs} args - Arguments to update many Tenants.
     * @example
     * // Update many Tenants
     * const tenants = await prisma.tenants.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenants and only return the `id`
     * const tenantsWithIdOnly = await prisma.tenants.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenantsUpdateManyAndReturnArgs>(args: SelectSubset<T, tenantsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenants.
     * @param {tenantsUpsertArgs} args - Arguments to update or create a Tenants.
     * @example
     * // Update or create a Tenants
     * const tenants = await prisma.tenants.upsert({
     *   create: {
     *     // ... data to create a Tenants
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenants we want to update
     *   }
     * })
     */
    upsert<T extends tenantsUpsertArgs>(args: SelectSubset<T, tenantsUpsertArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsCountArgs} args - Arguments to filter Tenants to count.
     * @example
     * // Count the number of Tenants
     * const count = await prisma.tenants.count({
     *   where: {
     *     // ... the filter for the Tenants we want to count
     *   }
     * })
    **/
    count<T extends tenantsCountArgs>(
      args?: Subset<T, tenantsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantsAggregateArgs>(args: Subset<T, TenantsAggregateArgs>): Prisma.PrismaPromise<GetTenantsAggregateType<T>>

    /**
     * Group by Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenantsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenantsGroupByArgs['orderBy'] }
        : { orderBy?: tenantsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenantsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenants model
   */
  readonly fields: tenantsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenants.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenantsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    telegram_users<T extends tenants$telegram_usersArgs<ExtArgs> = {}>(args?: Subset<T, tenants$telegram_usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    door_tasks<T extends tenants$door_tasksArgs<ExtArgs> = {}>(args?: Subset<T, tenants$door_tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenants model
   */
  interface tenantsFieldRefs {
    readonly id: FieldRef<"tenants", 'Int'>
    readonly name: FieldRef<"tenants", 'String'>
    readonly subdomain: FieldRef<"tenants", 'String'>
    readonly schema: FieldRef<"tenants", 'String'>
    readonly modules: FieldRef<"tenants", 'String[]'>
  }
    

  // Custom InputTypes
  /**
   * tenants findUnique
   */
  export type tenantsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants findUniqueOrThrow
   */
  export type tenantsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants findFirst
   */
  export type tenantsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenants.
     */
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants findFirstOrThrow
   */
  export type tenantsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenants.
     */
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants findMany
   */
  export type tenantsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants create
   */
  export type tenantsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The data needed to create a tenants.
     */
    data: XOR<tenantsCreateInput, tenantsUncheckedCreateInput>
  }

  /**
   * tenants createMany
   */
  export type tenantsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenants.
     */
    data: tenantsCreateManyInput | tenantsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenants createManyAndReturn
   */
  export type tenantsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * The data used to create many tenants.
     */
    data: tenantsCreateManyInput | tenantsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenants update
   */
  export type tenantsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The data needed to update a tenants.
     */
    data: XOR<tenantsUpdateInput, tenantsUncheckedUpdateInput>
    /**
     * Choose, which tenants to update.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants updateMany
   */
  export type tenantsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenants.
     */
    data: XOR<tenantsUpdateManyMutationInput, tenantsUncheckedUpdateManyInput>
    /**
     * Filter which tenants to update
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to update.
     */
    limit?: number
  }

  /**
   * tenants updateManyAndReturn
   */
  export type tenantsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * The data used to update tenants.
     */
    data: XOR<tenantsUpdateManyMutationInput, tenantsUncheckedUpdateManyInput>
    /**
     * Filter which tenants to update
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to update.
     */
    limit?: number
  }

  /**
   * tenants upsert
   */
  export type tenantsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The filter to search for the tenants to update in case it exists.
     */
    where: tenantsWhereUniqueInput
    /**
     * In case the tenants found by the `where` argument doesn't exist, create a new tenants with this data.
     */
    create: XOR<tenantsCreateInput, tenantsUncheckedCreateInput>
    /**
     * In case the tenants was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenantsUpdateInput, tenantsUncheckedUpdateInput>
  }

  /**
   * tenants delete
   */
  export type tenantsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter which tenants to delete.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants deleteMany
   */
  export type tenantsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenants to delete
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to delete.
     */
    limit?: number
  }

  /**
   * tenants.telegram_users
   */
  export type tenants$telegram_usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    where?: tenant_telegram_usersWhereInput
    orderBy?: tenant_telegram_usersOrderByWithRelationInput | tenant_telegram_usersOrderByWithRelationInput[]
    cursor?: tenant_telegram_usersWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Tenant_telegram_usersScalarFieldEnum | Tenant_telegram_usersScalarFieldEnum[]
  }

  /**
   * tenants.door_tasks
   */
  export type tenants$door_tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    where?: employee_door_tasksWhereInput
    orderBy?: employee_door_tasksOrderByWithRelationInput | employee_door_tasksOrderByWithRelationInput[]
    cursor?: employee_door_tasksWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Employee_door_tasksScalarFieldEnum | Employee_door_tasksScalarFieldEnum[]
  }

  /**
   * tenants without action
   */
  export type tenantsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
  }


  /**
   * Model employee_door_tasks
   */

  export type AggregateEmployee_door_tasks = {
    _count: Employee_door_tasksCountAggregateOutputType | null
    _avg: Employee_door_tasksAvgAggregateOutputType | null
    _sum: Employee_door_tasksSumAggregateOutputType | null
    _min: Employee_door_tasksMinAggregateOutputType | null
    _max: Employee_door_tasksMaxAggregateOutputType | null
  }

  export type Employee_door_tasksAvgAggregateOutputType = {
    id: number | null
    tenant_id: number | null
    employee_id: number | null
    door_id: number | null
    retry_count: number | null
  }

  export type Employee_door_tasksSumAggregateOutputType = {
    id: number | null
    tenant_id: number | null
    employee_id: number | null
    door_id: number | null
    retry_count: number | null
  }

  export type Employee_door_tasksMinAggregateOutputType = {
    id: number | null
    tenant_id: number | null
    employee_id: number | null
    door_id: number | null
    action: string | null
    status: string | null
    retry_count: number | null
    error: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Employee_door_tasksMaxAggregateOutputType = {
    id: number | null
    tenant_id: number | null
    employee_id: number | null
    door_id: number | null
    action: string | null
    status: string | null
    retry_count: number | null
    error: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Employee_door_tasksCountAggregateOutputType = {
    id: number
    tenant_id: number
    employee_id: number
    door_id: number
    action: number
    status: number
    retry_count: number
    error: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Employee_door_tasksAvgAggregateInputType = {
    id?: true
    tenant_id?: true
    employee_id?: true
    door_id?: true
    retry_count?: true
  }

  export type Employee_door_tasksSumAggregateInputType = {
    id?: true
    tenant_id?: true
    employee_id?: true
    door_id?: true
    retry_count?: true
  }

  export type Employee_door_tasksMinAggregateInputType = {
    id?: true
    tenant_id?: true
    employee_id?: true
    door_id?: true
    action?: true
    status?: true
    retry_count?: true
    error?: true
    created_at?: true
    updated_at?: true
  }

  export type Employee_door_tasksMaxAggregateInputType = {
    id?: true
    tenant_id?: true
    employee_id?: true
    door_id?: true
    action?: true
    status?: true
    retry_count?: true
    error?: true
    created_at?: true
    updated_at?: true
  }

  export type Employee_door_tasksCountAggregateInputType = {
    id?: true
    tenant_id?: true
    employee_id?: true
    door_id?: true
    action?: true
    status?: true
    retry_count?: true
    error?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Employee_door_tasksAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which employee_door_tasks to aggregate.
     */
    where?: employee_door_tasksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of employee_door_tasks to fetch.
     */
    orderBy?: employee_door_tasksOrderByWithRelationInput | employee_door_tasksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: employee_door_tasksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` employee_door_tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` employee_door_tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned employee_door_tasks
    **/
    _count?: true | Employee_door_tasksCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Employee_door_tasksAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Employee_door_tasksSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Employee_door_tasksMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Employee_door_tasksMaxAggregateInputType
  }

  export type GetEmployee_door_tasksAggregateType<T extends Employee_door_tasksAggregateArgs> = {
        [P in keyof T & keyof AggregateEmployee_door_tasks]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmployee_door_tasks[P]>
      : GetScalarType<T[P], AggregateEmployee_door_tasks[P]>
  }




  export type employee_door_tasksGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: employee_door_tasksWhereInput
    orderBy?: employee_door_tasksOrderByWithAggregationInput | employee_door_tasksOrderByWithAggregationInput[]
    by: Employee_door_tasksScalarFieldEnum[] | Employee_door_tasksScalarFieldEnum
    having?: employee_door_tasksScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Employee_door_tasksCountAggregateInputType | true
    _avg?: Employee_door_tasksAvgAggregateInputType
    _sum?: Employee_door_tasksSumAggregateInputType
    _min?: Employee_door_tasksMinAggregateInputType
    _max?: Employee_door_tasksMaxAggregateInputType
  }

  export type Employee_door_tasksGroupByOutputType = {
    id: number
    tenant_id: number
    employee_id: number
    door_id: number
    action: string
    status: string
    retry_count: number
    error: string | null
    created_at: Date
    updated_at: Date | null
    _count: Employee_door_tasksCountAggregateOutputType | null
    _avg: Employee_door_tasksAvgAggregateOutputType | null
    _sum: Employee_door_tasksSumAggregateOutputType | null
    _min: Employee_door_tasksMinAggregateOutputType | null
    _max: Employee_door_tasksMaxAggregateOutputType | null
  }

  type GetEmployee_door_tasksGroupByPayload<T extends employee_door_tasksGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Employee_door_tasksGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Employee_door_tasksGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Employee_door_tasksGroupByOutputType[P]>
            : GetScalarType<T[P], Employee_door_tasksGroupByOutputType[P]>
        }
      >
    >


  export type employee_door_tasksSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    employee_id?: boolean
    door_id?: boolean
    action?: boolean
    status?: boolean
    retry_count?: boolean
    error?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["employee_door_tasks"]>

  export type employee_door_tasksSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    employee_id?: boolean
    door_id?: boolean
    action?: boolean
    status?: boolean
    retry_count?: boolean
    error?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["employee_door_tasks"]>

  export type employee_door_tasksSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    employee_id?: boolean
    door_id?: boolean
    action?: boolean
    status?: boolean
    retry_count?: boolean
    error?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["employee_door_tasks"]>

  export type employee_door_tasksSelectScalar = {
    id?: boolean
    tenant_id?: boolean
    employee_id?: boolean
    door_id?: boolean
    action?: boolean
    status?: boolean
    retry_count?: boolean
    error?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type employee_door_tasksOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenant_id" | "employee_id" | "door_id" | "action" | "status" | "retry_count" | "error" | "created_at" | "updated_at", ExtArgs["result"]["employee_door_tasks"]>
  export type employee_door_tasksInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type employee_door_tasksIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type employee_door_tasksIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $employee_door_tasksPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "employee_door_tasks"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      tenant_id: number
      employee_id: number
      door_id: number
      action: string
      status: string
      retry_count: number
      error: string | null
      created_at: Date
      updated_at: Date | null
    }, ExtArgs["result"]["employee_door_tasks"]>
    composites: {}
  }

  type employee_door_tasksGetPayload<S extends boolean | null | undefined | employee_door_tasksDefaultArgs> = $Result.GetResult<Prisma.$employee_door_tasksPayload, S>

  type employee_door_tasksCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<employee_door_tasksFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Employee_door_tasksCountAggregateInputType | true
    }

  export interface employee_door_tasksDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['employee_door_tasks'], meta: { name: 'employee_door_tasks' } }
    /**
     * Find zero or one Employee_door_tasks that matches the filter.
     * @param {employee_door_tasksFindUniqueArgs} args - Arguments to find a Employee_door_tasks
     * @example
     * // Get one Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends employee_door_tasksFindUniqueArgs>(args: SelectSubset<T, employee_door_tasksFindUniqueArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Employee_door_tasks that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {employee_door_tasksFindUniqueOrThrowArgs} args - Arguments to find a Employee_door_tasks
     * @example
     * // Get one Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends employee_door_tasksFindUniqueOrThrowArgs>(args: SelectSubset<T, employee_door_tasksFindUniqueOrThrowArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Employee_door_tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksFindFirstArgs} args - Arguments to find a Employee_door_tasks
     * @example
     * // Get one Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends employee_door_tasksFindFirstArgs>(args?: SelectSubset<T, employee_door_tasksFindFirstArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Employee_door_tasks that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksFindFirstOrThrowArgs} args - Arguments to find a Employee_door_tasks
     * @example
     * // Get one Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends employee_door_tasksFindFirstOrThrowArgs>(args?: SelectSubset<T, employee_door_tasksFindFirstOrThrowArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Employee_door_tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findMany()
     * 
     * // Get first 10 Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const employee_door_tasksWithIdOnly = await prisma.employee_door_tasks.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends employee_door_tasksFindManyArgs>(args?: SelectSubset<T, employee_door_tasksFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Employee_door_tasks.
     * @param {employee_door_tasksCreateArgs} args - Arguments to create a Employee_door_tasks.
     * @example
     * // Create one Employee_door_tasks
     * const Employee_door_tasks = await prisma.employee_door_tasks.create({
     *   data: {
     *     // ... data to create a Employee_door_tasks
     *   }
     * })
     * 
     */
    create<T extends employee_door_tasksCreateArgs>(args: SelectSubset<T, employee_door_tasksCreateArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Employee_door_tasks.
     * @param {employee_door_tasksCreateManyArgs} args - Arguments to create many Employee_door_tasks.
     * @example
     * // Create many Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends employee_door_tasksCreateManyArgs>(args?: SelectSubset<T, employee_door_tasksCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Employee_door_tasks and returns the data saved in the database.
     * @param {employee_door_tasksCreateManyAndReturnArgs} args - Arguments to create many Employee_door_tasks.
     * @example
     * // Create many Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Employee_door_tasks and only return the `id`
     * const employee_door_tasksWithIdOnly = await prisma.employee_door_tasks.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends employee_door_tasksCreateManyAndReturnArgs>(args?: SelectSubset<T, employee_door_tasksCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Employee_door_tasks.
     * @param {employee_door_tasksDeleteArgs} args - Arguments to delete one Employee_door_tasks.
     * @example
     * // Delete one Employee_door_tasks
     * const Employee_door_tasks = await prisma.employee_door_tasks.delete({
     *   where: {
     *     // ... filter to delete one Employee_door_tasks
     *   }
     * })
     * 
     */
    delete<T extends employee_door_tasksDeleteArgs>(args: SelectSubset<T, employee_door_tasksDeleteArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Employee_door_tasks.
     * @param {employee_door_tasksUpdateArgs} args - Arguments to update one Employee_door_tasks.
     * @example
     * // Update one Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends employee_door_tasksUpdateArgs>(args: SelectSubset<T, employee_door_tasksUpdateArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Employee_door_tasks.
     * @param {employee_door_tasksDeleteManyArgs} args - Arguments to filter Employee_door_tasks to delete.
     * @example
     * // Delete a few Employee_door_tasks
     * const { count } = await prisma.employee_door_tasks.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends employee_door_tasksDeleteManyArgs>(args?: SelectSubset<T, employee_door_tasksDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Employee_door_tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends employee_door_tasksUpdateManyArgs>(args: SelectSubset<T, employee_door_tasksUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Employee_door_tasks and returns the data updated in the database.
     * @param {employee_door_tasksUpdateManyAndReturnArgs} args - Arguments to update many Employee_door_tasks.
     * @example
     * // Update many Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Employee_door_tasks and only return the `id`
     * const employee_door_tasksWithIdOnly = await prisma.employee_door_tasks.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends employee_door_tasksUpdateManyAndReturnArgs>(args: SelectSubset<T, employee_door_tasksUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Employee_door_tasks.
     * @param {employee_door_tasksUpsertArgs} args - Arguments to update or create a Employee_door_tasks.
     * @example
     * // Update or create a Employee_door_tasks
     * const employee_door_tasks = await prisma.employee_door_tasks.upsert({
     *   create: {
     *     // ... data to create a Employee_door_tasks
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Employee_door_tasks we want to update
     *   }
     * })
     */
    upsert<T extends employee_door_tasksUpsertArgs>(args: SelectSubset<T, employee_door_tasksUpsertArgs<ExtArgs>>): Prisma__employee_door_tasksClient<$Result.GetResult<Prisma.$employee_door_tasksPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Employee_door_tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksCountArgs} args - Arguments to filter Employee_door_tasks to count.
     * @example
     * // Count the number of Employee_door_tasks
     * const count = await prisma.employee_door_tasks.count({
     *   where: {
     *     // ... the filter for the Employee_door_tasks we want to count
     *   }
     * })
    **/
    count<T extends employee_door_tasksCountArgs>(
      args?: Subset<T, employee_door_tasksCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Employee_door_tasksCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Employee_door_tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Employee_door_tasksAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Employee_door_tasksAggregateArgs>(args: Subset<T, Employee_door_tasksAggregateArgs>): Prisma.PrismaPromise<GetEmployee_door_tasksAggregateType<T>>

    /**
     * Group by Employee_door_tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {employee_door_tasksGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends employee_door_tasksGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: employee_door_tasksGroupByArgs['orderBy'] }
        : { orderBy?: employee_door_tasksGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, employee_door_tasksGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmployee_door_tasksGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the employee_door_tasks model
   */
  readonly fields: employee_door_tasksFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for employee_door_tasks.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__employee_door_tasksClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the employee_door_tasks model
   */
  interface employee_door_tasksFieldRefs {
    readonly id: FieldRef<"employee_door_tasks", 'Int'>
    readonly tenant_id: FieldRef<"employee_door_tasks", 'Int'>
    readonly employee_id: FieldRef<"employee_door_tasks", 'Int'>
    readonly door_id: FieldRef<"employee_door_tasks", 'Int'>
    readonly action: FieldRef<"employee_door_tasks", 'String'>
    readonly status: FieldRef<"employee_door_tasks", 'String'>
    readonly retry_count: FieldRef<"employee_door_tasks", 'Int'>
    readonly error: FieldRef<"employee_door_tasks", 'String'>
    readonly created_at: FieldRef<"employee_door_tasks", 'DateTime'>
    readonly updated_at: FieldRef<"employee_door_tasks", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * employee_door_tasks findUnique
   */
  export type employee_door_tasksFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter, which employee_door_tasks to fetch.
     */
    where: employee_door_tasksWhereUniqueInput
  }

  /**
   * employee_door_tasks findUniqueOrThrow
   */
  export type employee_door_tasksFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter, which employee_door_tasks to fetch.
     */
    where: employee_door_tasksWhereUniqueInput
  }

  /**
   * employee_door_tasks findFirst
   */
  export type employee_door_tasksFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter, which employee_door_tasks to fetch.
     */
    where?: employee_door_tasksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of employee_door_tasks to fetch.
     */
    orderBy?: employee_door_tasksOrderByWithRelationInput | employee_door_tasksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for employee_door_tasks.
     */
    cursor?: employee_door_tasksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` employee_door_tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` employee_door_tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of employee_door_tasks.
     */
    distinct?: Employee_door_tasksScalarFieldEnum | Employee_door_tasksScalarFieldEnum[]
  }

  /**
   * employee_door_tasks findFirstOrThrow
   */
  export type employee_door_tasksFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter, which employee_door_tasks to fetch.
     */
    where?: employee_door_tasksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of employee_door_tasks to fetch.
     */
    orderBy?: employee_door_tasksOrderByWithRelationInput | employee_door_tasksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for employee_door_tasks.
     */
    cursor?: employee_door_tasksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` employee_door_tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` employee_door_tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of employee_door_tasks.
     */
    distinct?: Employee_door_tasksScalarFieldEnum | Employee_door_tasksScalarFieldEnum[]
  }

  /**
   * employee_door_tasks findMany
   */
  export type employee_door_tasksFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter, which employee_door_tasks to fetch.
     */
    where?: employee_door_tasksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of employee_door_tasks to fetch.
     */
    orderBy?: employee_door_tasksOrderByWithRelationInput | employee_door_tasksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing employee_door_tasks.
     */
    cursor?: employee_door_tasksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` employee_door_tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` employee_door_tasks.
     */
    skip?: number
    distinct?: Employee_door_tasksScalarFieldEnum | Employee_door_tasksScalarFieldEnum[]
  }

  /**
   * employee_door_tasks create
   */
  export type employee_door_tasksCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * The data needed to create a employee_door_tasks.
     */
    data: XOR<employee_door_tasksCreateInput, employee_door_tasksUncheckedCreateInput>
  }

  /**
   * employee_door_tasks createMany
   */
  export type employee_door_tasksCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many employee_door_tasks.
     */
    data: employee_door_tasksCreateManyInput | employee_door_tasksCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * employee_door_tasks createManyAndReturn
   */
  export type employee_door_tasksCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * The data used to create many employee_door_tasks.
     */
    data: employee_door_tasksCreateManyInput | employee_door_tasksCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * employee_door_tasks update
   */
  export type employee_door_tasksUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * The data needed to update a employee_door_tasks.
     */
    data: XOR<employee_door_tasksUpdateInput, employee_door_tasksUncheckedUpdateInput>
    /**
     * Choose, which employee_door_tasks to update.
     */
    where: employee_door_tasksWhereUniqueInput
  }

  /**
   * employee_door_tasks updateMany
   */
  export type employee_door_tasksUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update employee_door_tasks.
     */
    data: XOR<employee_door_tasksUpdateManyMutationInput, employee_door_tasksUncheckedUpdateManyInput>
    /**
     * Filter which employee_door_tasks to update
     */
    where?: employee_door_tasksWhereInput
    /**
     * Limit how many employee_door_tasks to update.
     */
    limit?: number
  }

  /**
   * employee_door_tasks updateManyAndReturn
   */
  export type employee_door_tasksUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * The data used to update employee_door_tasks.
     */
    data: XOR<employee_door_tasksUpdateManyMutationInput, employee_door_tasksUncheckedUpdateManyInput>
    /**
     * Filter which employee_door_tasks to update
     */
    where?: employee_door_tasksWhereInput
    /**
     * Limit how many employee_door_tasks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * employee_door_tasks upsert
   */
  export type employee_door_tasksUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * The filter to search for the employee_door_tasks to update in case it exists.
     */
    where: employee_door_tasksWhereUniqueInput
    /**
     * In case the employee_door_tasks found by the `where` argument doesn't exist, create a new employee_door_tasks with this data.
     */
    create: XOR<employee_door_tasksCreateInput, employee_door_tasksUncheckedCreateInput>
    /**
     * In case the employee_door_tasks was found with the provided `where` argument, update it with this data.
     */
    update: XOR<employee_door_tasksUpdateInput, employee_door_tasksUncheckedUpdateInput>
  }

  /**
   * employee_door_tasks delete
   */
  export type employee_door_tasksDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
    /**
     * Filter which employee_door_tasks to delete.
     */
    where: employee_door_tasksWhereUniqueInput
  }

  /**
   * employee_door_tasks deleteMany
   */
  export type employee_door_tasksDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which employee_door_tasks to delete
     */
    where?: employee_door_tasksWhereInput
    /**
     * Limit how many employee_door_tasks to delete.
     */
    limit?: number
  }

  /**
   * employee_door_tasks without action
   */
  export type employee_door_tasksDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the employee_door_tasks
     */
    select?: employee_door_tasksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the employee_door_tasks
     */
    omit?: employee_door_tasksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: employee_door_tasksInclude<ExtArgs> | null
  }


  /**
   * Model tenant_telegram_users
   */

  export type AggregateTenant_telegram_users = {
    _count: Tenant_telegram_usersCountAggregateOutputType | null
    _avg: Tenant_telegram_usersAvgAggregateOutputType | null
    _sum: Tenant_telegram_usersSumAggregateOutputType | null
    _min: Tenant_telegram_usersMinAggregateOutputType | null
    _max: Tenant_telegram_usersMaxAggregateOutputType | null
  }

  export type Tenant_telegram_usersAvgAggregateOutputType = {
    tenant_id: number | null
  }

  export type Tenant_telegram_usersSumAggregateOutputType = {
    tenant_id: number | null
  }

  export type Tenant_telegram_usersMinAggregateOutputType = {
    telegram_id: string | null
    tenant_id: number | null
    created_at: Date | null
  }

  export type Tenant_telegram_usersMaxAggregateOutputType = {
    telegram_id: string | null
    tenant_id: number | null
    created_at: Date | null
  }

  export type Tenant_telegram_usersCountAggregateOutputType = {
    telegram_id: number
    tenant_id: number
    created_at: number
    _all: number
  }


  export type Tenant_telegram_usersAvgAggregateInputType = {
    tenant_id?: true
  }

  export type Tenant_telegram_usersSumAggregateInputType = {
    tenant_id?: true
  }

  export type Tenant_telegram_usersMinAggregateInputType = {
    telegram_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Tenant_telegram_usersMaxAggregateInputType = {
    telegram_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Tenant_telegram_usersCountAggregateInputType = {
    telegram_id?: true
    tenant_id?: true
    created_at?: true
    _all?: true
  }

  export type Tenant_telegram_usersAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_telegram_users to aggregate.
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_telegram_users to fetch.
     */
    orderBy?: tenant_telegram_usersOrderByWithRelationInput | tenant_telegram_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenant_telegram_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_telegram_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_telegram_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenant_telegram_users
    **/
    _count?: true | Tenant_telegram_usersCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Tenant_telegram_usersAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Tenant_telegram_usersSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Tenant_telegram_usersMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Tenant_telegram_usersMaxAggregateInputType
  }

  export type GetTenant_telegram_usersAggregateType<T extends Tenant_telegram_usersAggregateArgs> = {
        [P in keyof T & keyof AggregateTenant_telegram_users]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenant_telegram_users[P]>
      : GetScalarType<T[P], AggregateTenant_telegram_users[P]>
  }




  export type tenant_telegram_usersGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_telegram_usersWhereInput
    orderBy?: tenant_telegram_usersOrderByWithAggregationInput | tenant_telegram_usersOrderByWithAggregationInput[]
    by: Tenant_telegram_usersScalarFieldEnum[] | Tenant_telegram_usersScalarFieldEnum
    having?: tenant_telegram_usersScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Tenant_telegram_usersCountAggregateInputType | true
    _avg?: Tenant_telegram_usersAvgAggregateInputType
    _sum?: Tenant_telegram_usersSumAggregateInputType
    _min?: Tenant_telegram_usersMinAggregateInputType
    _max?: Tenant_telegram_usersMaxAggregateInputType
  }

  export type Tenant_telegram_usersGroupByOutputType = {
    telegram_id: string
    tenant_id: number
    created_at: Date
    _count: Tenant_telegram_usersCountAggregateOutputType | null
    _avg: Tenant_telegram_usersAvgAggregateOutputType | null
    _sum: Tenant_telegram_usersSumAggregateOutputType | null
    _min: Tenant_telegram_usersMinAggregateOutputType | null
    _max: Tenant_telegram_usersMaxAggregateOutputType | null
  }

  type GetTenant_telegram_usersGroupByPayload<T extends tenant_telegram_usersGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Tenant_telegram_usersGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Tenant_telegram_usersGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Tenant_telegram_usersGroupByOutputType[P]>
            : GetScalarType<T[P], Tenant_telegram_usersGroupByOutputType[P]>
        }
      >
    >


  export type tenant_telegram_usersSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    telegram_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_telegram_users"]>

  export type tenant_telegram_usersSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    telegram_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_telegram_users"]>

  export type tenant_telegram_usersSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    telegram_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_telegram_users"]>

  export type tenant_telegram_usersSelectScalar = {
    telegram_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }

  export type tenant_telegram_usersOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"telegram_id" | "tenant_id" | "created_at", ExtArgs["result"]["tenant_telegram_users"]>
  export type tenant_telegram_usersInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_telegram_usersIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_telegram_usersIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $tenant_telegram_usersPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenant_telegram_users"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      telegram_id: string
      tenant_id: number
      created_at: Date
    }, ExtArgs["result"]["tenant_telegram_users"]>
    composites: {}
  }

  type tenant_telegram_usersGetPayload<S extends boolean | null | undefined | tenant_telegram_usersDefaultArgs> = $Result.GetResult<Prisma.$tenant_telegram_usersPayload, S>

  type tenant_telegram_usersCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenant_telegram_usersFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Tenant_telegram_usersCountAggregateInputType | true
    }

  export interface tenant_telegram_usersDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenant_telegram_users'], meta: { name: 'tenant_telegram_users' } }
    /**
     * Find zero or one Tenant_telegram_users that matches the filter.
     * @param {tenant_telegram_usersFindUniqueArgs} args - Arguments to find a Tenant_telegram_users
     * @example
     * // Get one Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenant_telegram_usersFindUniqueArgs>(args: SelectSubset<T, tenant_telegram_usersFindUniqueArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenant_telegram_users that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenant_telegram_usersFindUniqueOrThrowArgs} args - Arguments to find a Tenant_telegram_users
     * @example
     * // Get one Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenant_telegram_usersFindUniqueOrThrowArgs>(args: SelectSubset<T, tenant_telegram_usersFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_telegram_users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersFindFirstArgs} args - Arguments to find a Tenant_telegram_users
     * @example
     * // Get one Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenant_telegram_usersFindFirstArgs>(args?: SelectSubset<T, tenant_telegram_usersFindFirstArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_telegram_users that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersFindFirstOrThrowArgs} args - Arguments to find a Tenant_telegram_users
     * @example
     * // Get one Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenant_telegram_usersFindFirstOrThrowArgs>(args?: SelectSubset<T, tenant_telegram_usersFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenant_telegram_users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findMany()
     * 
     * // Get first 10 Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.findMany({ take: 10 })
     * 
     * // Only select the `telegram_id`
     * const tenant_telegram_usersWithTelegram_idOnly = await prisma.tenant_telegram_users.findMany({ select: { telegram_id: true } })
     * 
     */
    findMany<T extends tenant_telegram_usersFindManyArgs>(args?: SelectSubset<T, tenant_telegram_usersFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenant_telegram_users.
     * @param {tenant_telegram_usersCreateArgs} args - Arguments to create a Tenant_telegram_users.
     * @example
     * // Create one Tenant_telegram_users
     * const Tenant_telegram_users = await prisma.tenant_telegram_users.create({
     *   data: {
     *     // ... data to create a Tenant_telegram_users
     *   }
     * })
     * 
     */
    create<T extends tenant_telegram_usersCreateArgs>(args: SelectSubset<T, tenant_telegram_usersCreateArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenant_telegram_users.
     * @param {tenant_telegram_usersCreateManyArgs} args - Arguments to create many Tenant_telegram_users.
     * @example
     * // Create many Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenant_telegram_usersCreateManyArgs>(args?: SelectSubset<T, tenant_telegram_usersCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenant_telegram_users and returns the data saved in the database.
     * @param {tenant_telegram_usersCreateManyAndReturnArgs} args - Arguments to create many Tenant_telegram_users.
     * @example
     * // Create many Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenant_telegram_users and only return the `telegram_id`
     * const tenant_telegram_usersWithTelegram_idOnly = await prisma.tenant_telegram_users.createManyAndReturn({
     *   select: { telegram_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenant_telegram_usersCreateManyAndReturnArgs>(args?: SelectSubset<T, tenant_telegram_usersCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenant_telegram_users.
     * @param {tenant_telegram_usersDeleteArgs} args - Arguments to delete one Tenant_telegram_users.
     * @example
     * // Delete one Tenant_telegram_users
     * const Tenant_telegram_users = await prisma.tenant_telegram_users.delete({
     *   where: {
     *     // ... filter to delete one Tenant_telegram_users
     *   }
     * })
     * 
     */
    delete<T extends tenant_telegram_usersDeleteArgs>(args: SelectSubset<T, tenant_telegram_usersDeleteArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenant_telegram_users.
     * @param {tenant_telegram_usersUpdateArgs} args - Arguments to update one Tenant_telegram_users.
     * @example
     * // Update one Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenant_telegram_usersUpdateArgs>(args: SelectSubset<T, tenant_telegram_usersUpdateArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenant_telegram_users.
     * @param {tenant_telegram_usersDeleteManyArgs} args - Arguments to filter Tenant_telegram_users to delete.
     * @example
     * // Delete a few Tenant_telegram_users
     * const { count } = await prisma.tenant_telegram_users.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenant_telegram_usersDeleteManyArgs>(args?: SelectSubset<T, tenant_telegram_usersDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_telegram_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenant_telegram_usersUpdateManyArgs>(args: SelectSubset<T, tenant_telegram_usersUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_telegram_users and returns the data updated in the database.
     * @param {tenant_telegram_usersUpdateManyAndReturnArgs} args - Arguments to update many Tenant_telegram_users.
     * @example
     * // Update many Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenant_telegram_users and only return the `telegram_id`
     * const tenant_telegram_usersWithTelegram_idOnly = await prisma.tenant_telegram_users.updateManyAndReturn({
     *   select: { telegram_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenant_telegram_usersUpdateManyAndReturnArgs>(args: SelectSubset<T, tenant_telegram_usersUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenant_telegram_users.
     * @param {tenant_telegram_usersUpsertArgs} args - Arguments to update or create a Tenant_telegram_users.
     * @example
     * // Update or create a Tenant_telegram_users
     * const tenant_telegram_users = await prisma.tenant_telegram_users.upsert({
     *   create: {
     *     // ... data to create a Tenant_telegram_users
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenant_telegram_users we want to update
     *   }
     * })
     */
    upsert<T extends tenant_telegram_usersUpsertArgs>(args: SelectSubset<T, tenant_telegram_usersUpsertArgs<ExtArgs>>): Prisma__tenant_telegram_usersClient<$Result.GetResult<Prisma.$tenant_telegram_usersPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenant_telegram_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersCountArgs} args - Arguments to filter Tenant_telegram_users to count.
     * @example
     * // Count the number of Tenant_telegram_users
     * const count = await prisma.tenant_telegram_users.count({
     *   where: {
     *     // ... the filter for the Tenant_telegram_users we want to count
     *   }
     * })
    **/
    count<T extends tenant_telegram_usersCountArgs>(
      args?: Subset<T, tenant_telegram_usersCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Tenant_telegram_usersCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenant_telegram_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Tenant_telegram_usersAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Tenant_telegram_usersAggregateArgs>(args: Subset<T, Tenant_telegram_usersAggregateArgs>): Prisma.PrismaPromise<GetTenant_telegram_usersAggregateType<T>>

    /**
     * Group by Tenant_telegram_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_telegram_usersGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenant_telegram_usersGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenant_telegram_usersGroupByArgs['orderBy'] }
        : { orderBy?: tenant_telegram_usersGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenant_telegram_usersGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenant_telegram_usersGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenant_telegram_users model
   */
  readonly fields: tenant_telegram_usersFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenant_telegram_users.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenant_telegram_usersClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenant_telegram_users model
   */
  interface tenant_telegram_usersFieldRefs {
    readonly telegram_id: FieldRef<"tenant_telegram_users", 'String'>
    readonly tenant_id: FieldRef<"tenant_telegram_users", 'Int'>
    readonly created_at: FieldRef<"tenant_telegram_users", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * tenant_telegram_users findUnique
   */
  export type tenant_telegram_usersFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter, which tenant_telegram_users to fetch.
     */
    where: tenant_telegram_usersWhereUniqueInput
  }

  /**
   * tenant_telegram_users findUniqueOrThrow
   */
  export type tenant_telegram_usersFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter, which tenant_telegram_users to fetch.
     */
    where: tenant_telegram_usersWhereUniqueInput
  }

  /**
   * tenant_telegram_users findFirst
   */
  export type tenant_telegram_usersFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter, which tenant_telegram_users to fetch.
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_telegram_users to fetch.
     */
    orderBy?: tenant_telegram_usersOrderByWithRelationInput | tenant_telegram_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_telegram_users.
     */
    cursor?: tenant_telegram_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_telegram_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_telegram_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_telegram_users.
     */
    distinct?: Tenant_telegram_usersScalarFieldEnum | Tenant_telegram_usersScalarFieldEnum[]
  }

  /**
   * tenant_telegram_users findFirstOrThrow
   */
  export type tenant_telegram_usersFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter, which tenant_telegram_users to fetch.
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_telegram_users to fetch.
     */
    orderBy?: tenant_telegram_usersOrderByWithRelationInput | tenant_telegram_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_telegram_users.
     */
    cursor?: tenant_telegram_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_telegram_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_telegram_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_telegram_users.
     */
    distinct?: Tenant_telegram_usersScalarFieldEnum | Tenant_telegram_usersScalarFieldEnum[]
  }

  /**
   * tenant_telegram_users findMany
   */
  export type tenant_telegram_usersFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter, which tenant_telegram_users to fetch.
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_telegram_users to fetch.
     */
    orderBy?: tenant_telegram_usersOrderByWithRelationInput | tenant_telegram_usersOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenant_telegram_users.
     */
    cursor?: tenant_telegram_usersWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_telegram_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_telegram_users.
     */
    skip?: number
    distinct?: Tenant_telegram_usersScalarFieldEnum | Tenant_telegram_usersScalarFieldEnum[]
  }

  /**
   * tenant_telegram_users create
   */
  export type tenant_telegram_usersCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * The data needed to create a tenant_telegram_users.
     */
    data: XOR<tenant_telegram_usersCreateInput, tenant_telegram_usersUncheckedCreateInput>
  }

  /**
   * tenant_telegram_users createMany
   */
  export type tenant_telegram_usersCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenant_telegram_users.
     */
    data: tenant_telegram_usersCreateManyInput | tenant_telegram_usersCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenant_telegram_users createManyAndReturn
   */
  export type tenant_telegram_usersCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * The data used to create many tenant_telegram_users.
     */
    data: tenant_telegram_usersCreateManyInput | tenant_telegram_usersCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_telegram_users update
   */
  export type tenant_telegram_usersUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * The data needed to update a tenant_telegram_users.
     */
    data: XOR<tenant_telegram_usersUpdateInput, tenant_telegram_usersUncheckedUpdateInput>
    /**
     * Choose, which tenant_telegram_users to update.
     */
    where: tenant_telegram_usersWhereUniqueInput
  }

  /**
   * tenant_telegram_users updateMany
   */
  export type tenant_telegram_usersUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenant_telegram_users.
     */
    data: XOR<tenant_telegram_usersUpdateManyMutationInput, tenant_telegram_usersUncheckedUpdateManyInput>
    /**
     * Filter which tenant_telegram_users to update
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * Limit how many tenant_telegram_users to update.
     */
    limit?: number
  }

  /**
   * tenant_telegram_users updateManyAndReturn
   */
  export type tenant_telegram_usersUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * The data used to update tenant_telegram_users.
     */
    data: XOR<tenant_telegram_usersUpdateManyMutationInput, tenant_telegram_usersUncheckedUpdateManyInput>
    /**
     * Filter which tenant_telegram_users to update
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * Limit how many tenant_telegram_users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_telegram_users upsert
   */
  export type tenant_telegram_usersUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * The filter to search for the tenant_telegram_users to update in case it exists.
     */
    where: tenant_telegram_usersWhereUniqueInput
    /**
     * In case the tenant_telegram_users found by the `where` argument doesn't exist, create a new tenant_telegram_users with this data.
     */
    create: XOR<tenant_telegram_usersCreateInput, tenant_telegram_usersUncheckedCreateInput>
    /**
     * In case the tenant_telegram_users was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenant_telegram_usersUpdateInput, tenant_telegram_usersUncheckedUpdateInput>
  }

  /**
   * tenant_telegram_users delete
   */
  export type tenant_telegram_usersDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
    /**
     * Filter which tenant_telegram_users to delete.
     */
    where: tenant_telegram_usersWhereUniqueInput
  }

  /**
   * tenant_telegram_users deleteMany
   */
  export type tenant_telegram_usersDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_telegram_users to delete
     */
    where?: tenant_telegram_usersWhereInput
    /**
     * Limit how many tenant_telegram_users to delete.
     */
    limit?: number
  }

  /**
   * tenant_telegram_users without action
   */
  export type tenant_telegram_usersDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_telegram_users
     */
    select?: tenant_telegram_usersSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_telegram_users
     */
    omit?: tenant_telegram_usersOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_telegram_usersInclude<ExtArgs> | null
  }


  /**
   * Model notifications_outbox
   */

  export type AggregateNotifications_outbox = {
    _count: Notifications_outboxCountAggregateOutputType | null
    _avg: Notifications_outboxAvgAggregateOutputType | null
    _sum: Notifications_outboxSumAggregateOutputType | null
    _min: Notifications_outboxMinAggregateOutputType | null
    _max: Notifications_outboxMaxAggregateOutputType | null
  }

  export type Notifications_outboxAvgAggregateOutputType = {
    id: number | null
    retry_count: number | null
  }

  export type Notifications_outboxSumAggregateOutputType = {
    id: number | null
    retry_count: number | null
  }

  export type Notifications_outboxMinAggregateOutputType = {
    id: number | null
    source_type: $Enums.NotificationSourceType | null
    event_date: Date | null
    chat_id: string | null
    status: string | null
    error: string | null
    retry_count: number | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Notifications_outboxMaxAggregateOutputType = {
    id: number | null
    source_type: $Enums.NotificationSourceType | null
    event_date: Date | null
    chat_id: string | null
    status: string | null
    error: string | null
    retry_count: number | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Notifications_outboxCountAggregateOutputType = {
    id: number
    source_type: number
    event_date: number
    chat_id: number
    payload: number
    status: number
    error: number
    retry_count: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Notifications_outboxAvgAggregateInputType = {
    id?: true
    retry_count?: true
  }

  export type Notifications_outboxSumAggregateInputType = {
    id?: true
    retry_count?: true
  }

  export type Notifications_outboxMinAggregateInputType = {
    id?: true
    source_type?: true
    event_date?: true
    chat_id?: true
    status?: true
    error?: true
    retry_count?: true
    created_at?: true
    updated_at?: true
  }

  export type Notifications_outboxMaxAggregateInputType = {
    id?: true
    source_type?: true
    event_date?: true
    chat_id?: true
    status?: true
    error?: true
    retry_count?: true
    created_at?: true
    updated_at?: true
  }

  export type Notifications_outboxCountAggregateInputType = {
    id?: true
    source_type?: true
    event_date?: true
    chat_id?: true
    payload?: true
    status?: true
    error?: true
    retry_count?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Notifications_outboxAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which notifications_outbox to aggregate.
     */
    where?: notifications_outboxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications_outboxes to fetch.
     */
    orderBy?: notifications_outboxOrderByWithRelationInput | notifications_outboxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: notifications_outboxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications_outboxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications_outboxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned notifications_outboxes
    **/
    _count?: true | Notifications_outboxCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Notifications_outboxAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Notifications_outboxSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Notifications_outboxMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Notifications_outboxMaxAggregateInputType
  }

  export type GetNotifications_outboxAggregateType<T extends Notifications_outboxAggregateArgs> = {
        [P in keyof T & keyof AggregateNotifications_outbox]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotifications_outbox[P]>
      : GetScalarType<T[P], AggregateNotifications_outbox[P]>
  }




  export type notifications_outboxGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: notifications_outboxWhereInput
    orderBy?: notifications_outboxOrderByWithAggregationInput | notifications_outboxOrderByWithAggregationInput[]
    by: Notifications_outboxScalarFieldEnum[] | Notifications_outboxScalarFieldEnum
    having?: notifications_outboxScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Notifications_outboxCountAggregateInputType | true
    _avg?: Notifications_outboxAvgAggregateInputType
    _sum?: Notifications_outboxSumAggregateInputType
    _min?: Notifications_outboxMinAggregateInputType
    _max?: Notifications_outboxMaxAggregateInputType
  }

  export type Notifications_outboxGroupByOutputType = {
    id: number
    source_type: $Enums.NotificationSourceType
    event_date: Date
    chat_id: string
    payload: JsonValue
    status: string
    error: string | null
    retry_count: number
    created_at: Date
    updated_at: Date
    _count: Notifications_outboxCountAggregateOutputType | null
    _avg: Notifications_outboxAvgAggregateOutputType | null
    _sum: Notifications_outboxSumAggregateOutputType | null
    _min: Notifications_outboxMinAggregateOutputType | null
    _max: Notifications_outboxMaxAggregateOutputType | null
  }

  type GetNotifications_outboxGroupByPayload<T extends notifications_outboxGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Notifications_outboxGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Notifications_outboxGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Notifications_outboxGroupByOutputType[P]>
            : GetScalarType<T[P], Notifications_outboxGroupByOutputType[P]>
        }
      >
    >


  export type notifications_outboxSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source_type?: boolean
    event_date?: boolean
    chat_id?: boolean
    payload?: boolean
    status?: boolean
    error?: boolean
    retry_count?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["notifications_outbox"]>

  export type notifications_outboxSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source_type?: boolean
    event_date?: boolean
    chat_id?: boolean
    payload?: boolean
    status?: boolean
    error?: boolean
    retry_count?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["notifications_outbox"]>

  export type notifications_outboxSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source_type?: boolean
    event_date?: boolean
    chat_id?: boolean
    payload?: boolean
    status?: boolean
    error?: boolean
    retry_count?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["notifications_outbox"]>

  export type notifications_outboxSelectScalar = {
    id?: boolean
    source_type?: boolean
    event_date?: boolean
    chat_id?: boolean
    payload?: boolean
    status?: boolean
    error?: boolean
    retry_count?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type notifications_outboxOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source_type" | "event_date" | "chat_id" | "payload" | "status" | "error" | "retry_count" | "created_at" | "updated_at", ExtArgs["result"]["notifications_outbox"]>

  export type $notifications_outboxPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "notifications_outbox"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      source_type: $Enums.NotificationSourceType
      event_date: Date
      chat_id: string
      payload: Prisma.JsonValue
      status: string
      error: string | null
      retry_count: number
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["notifications_outbox"]>
    composites: {}
  }

  type notifications_outboxGetPayload<S extends boolean | null | undefined | notifications_outboxDefaultArgs> = $Result.GetResult<Prisma.$notifications_outboxPayload, S>

  type notifications_outboxCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<notifications_outboxFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Notifications_outboxCountAggregateInputType | true
    }

  export interface notifications_outboxDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['notifications_outbox'], meta: { name: 'notifications_outbox' } }
    /**
     * Find zero or one Notifications_outbox that matches the filter.
     * @param {notifications_outboxFindUniqueArgs} args - Arguments to find a Notifications_outbox
     * @example
     * // Get one Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends notifications_outboxFindUniqueArgs>(args: SelectSubset<T, notifications_outboxFindUniqueArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Notifications_outbox that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {notifications_outboxFindUniqueOrThrowArgs} args - Arguments to find a Notifications_outbox
     * @example
     * // Get one Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends notifications_outboxFindUniqueOrThrowArgs>(args: SelectSubset<T, notifications_outboxFindUniqueOrThrowArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notifications_outbox that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxFindFirstArgs} args - Arguments to find a Notifications_outbox
     * @example
     * // Get one Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends notifications_outboxFindFirstArgs>(args?: SelectSubset<T, notifications_outboxFindFirstArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notifications_outbox that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxFindFirstOrThrowArgs} args - Arguments to find a Notifications_outbox
     * @example
     * // Get one Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends notifications_outboxFindFirstOrThrowArgs>(args?: SelectSubset<T, notifications_outboxFindFirstOrThrowArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notifications_outboxes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications_outboxes
     * const notifications_outboxes = await prisma.notifications_outbox.findMany()
     * 
     * // Get first 10 Notifications_outboxes
     * const notifications_outboxes = await prisma.notifications_outbox.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notifications_outboxWithIdOnly = await prisma.notifications_outbox.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends notifications_outboxFindManyArgs>(args?: SelectSubset<T, notifications_outboxFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Notifications_outbox.
     * @param {notifications_outboxCreateArgs} args - Arguments to create a Notifications_outbox.
     * @example
     * // Create one Notifications_outbox
     * const Notifications_outbox = await prisma.notifications_outbox.create({
     *   data: {
     *     // ... data to create a Notifications_outbox
     *   }
     * })
     * 
     */
    create<T extends notifications_outboxCreateArgs>(args: SelectSubset<T, notifications_outboxCreateArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notifications_outboxes.
     * @param {notifications_outboxCreateManyArgs} args - Arguments to create many Notifications_outboxes.
     * @example
     * // Create many Notifications_outboxes
     * const notifications_outbox = await prisma.notifications_outbox.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends notifications_outboxCreateManyArgs>(args?: SelectSubset<T, notifications_outboxCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications_outboxes and returns the data saved in the database.
     * @param {notifications_outboxCreateManyAndReturnArgs} args - Arguments to create many Notifications_outboxes.
     * @example
     * // Create many Notifications_outboxes
     * const notifications_outbox = await prisma.notifications_outbox.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications_outboxes and only return the `id`
     * const notifications_outboxWithIdOnly = await prisma.notifications_outbox.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends notifications_outboxCreateManyAndReturnArgs>(args?: SelectSubset<T, notifications_outboxCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Notifications_outbox.
     * @param {notifications_outboxDeleteArgs} args - Arguments to delete one Notifications_outbox.
     * @example
     * // Delete one Notifications_outbox
     * const Notifications_outbox = await prisma.notifications_outbox.delete({
     *   where: {
     *     // ... filter to delete one Notifications_outbox
     *   }
     * })
     * 
     */
    delete<T extends notifications_outboxDeleteArgs>(args: SelectSubset<T, notifications_outboxDeleteArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Notifications_outbox.
     * @param {notifications_outboxUpdateArgs} args - Arguments to update one Notifications_outbox.
     * @example
     * // Update one Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends notifications_outboxUpdateArgs>(args: SelectSubset<T, notifications_outboxUpdateArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notifications_outboxes.
     * @param {notifications_outboxDeleteManyArgs} args - Arguments to filter Notifications_outboxes to delete.
     * @example
     * // Delete a few Notifications_outboxes
     * const { count } = await prisma.notifications_outbox.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends notifications_outboxDeleteManyArgs>(args?: SelectSubset<T, notifications_outboxDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications_outboxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications_outboxes
     * const notifications_outbox = await prisma.notifications_outbox.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends notifications_outboxUpdateManyArgs>(args: SelectSubset<T, notifications_outboxUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications_outboxes and returns the data updated in the database.
     * @param {notifications_outboxUpdateManyAndReturnArgs} args - Arguments to update many Notifications_outboxes.
     * @example
     * // Update many Notifications_outboxes
     * const notifications_outbox = await prisma.notifications_outbox.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Notifications_outboxes and only return the `id`
     * const notifications_outboxWithIdOnly = await prisma.notifications_outbox.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends notifications_outboxUpdateManyAndReturnArgs>(args: SelectSubset<T, notifications_outboxUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Notifications_outbox.
     * @param {notifications_outboxUpsertArgs} args - Arguments to update or create a Notifications_outbox.
     * @example
     * // Update or create a Notifications_outbox
     * const notifications_outbox = await prisma.notifications_outbox.upsert({
     *   create: {
     *     // ... data to create a Notifications_outbox
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notifications_outbox we want to update
     *   }
     * })
     */
    upsert<T extends notifications_outboxUpsertArgs>(args: SelectSubset<T, notifications_outboxUpsertArgs<ExtArgs>>): Prisma__notifications_outboxClient<$Result.GetResult<Prisma.$notifications_outboxPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notifications_outboxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxCountArgs} args - Arguments to filter Notifications_outboxes to count.
     * @example
     * // Count the number of Notifications_outboxes
     * const count = await prisma.notifications_outbox.count({
     *   where: {
     *     // ... the filter for the Notifications_outboxes we want to count
     *   }
     * })
    **/
    count<T extends notifications_outboxCountArgs>(
      args?: Subset<T, notifications_outboxCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Notifications_outboxCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notifications_outbox.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Notifications_outboxAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Notifications_outboxAggregateArgs>(args: Subset<T, Notifications_outboxAggregateArgs>): Prisma.PrismaPromise<GetNotifications_outboxAggregateType<T>>

    /**
     * Group by Notifications_outbox.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {notifications_outboxGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends notifications_outboxGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: notifications_outboxGroupByArgs['orderBy'] }
        : { orderBy?: notifications_outboxGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, notifications_outboxGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotifications_outboxGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the notifications_outbox model
   */
  readonly fields: notifications_outboxFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for notifications_outbox.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__notifications_outboxClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the notifications_outbox model
   */
  interface notifications_outboxFieldRefs {
    readonly id: FieldRef<"notifications_outbox", 'Int'>
    readonly source_type: FieldRef<"notifications_outbox", 'NotificationSourceType'>
    readonly event_date: FieldRef<"notifications_outbox", 'DateTime'>
    readonly chat_id: FieldRef<"notifications_outbox", 'String'>
    readonly payload: FieldRef<"notifications_outbox", 'Json'>
    readonly status: FieldRef<"notifications_outbox", 'String'>
    readonly error: FieldRef<"notifications_outbox", 'String'>
    readonly retry_count: FieldRef<"notifications_outbox", 'Int'>
    readonly created_at: FieldRef<"notifications_outbox", 'DateTime'>
    readonly updated_at: FieldRef<"notifications_outbox", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * notifications_outbox findUnique
   */
  export type notifications_outboxFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter, which notifications_outbox to fetch.
     */
    where: notifications_outboxWhereUniqueInput
  }

  /**
   * notifications_outbox findUniqueOrThrow
   */
  export type notifications_outboxFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter, which notifications_outbox to fetch.
     */
    where: notifications_outboxWhereUniqueInput
  }

  /**
   * notifications_outbox findFirst
   */
  export type notifications_outboxFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter, which notifications_outbox to fetch.
     */
    where?: notifications_outboxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications_outboxes to fetch.
     */
    orderBy?: notifications_outboxOrderByWithRelationInput | notifications_outboxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for notifications_outboxes.
     */
    cursor?: notifications_outboxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications_outboxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications_outboxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of notifications_outboxes.
     */
    distinct?: Notifications_outboxScalarFieldEnum | Notifications_outboxScalarFieldEnum[]
  }

  /**
   * notifications_outbox findFirstOrThrow
   */
  export type notifications_outboxFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter, which notifications_outbox to fetch.
     */
    where?: notifications_outboxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications_outboxes to fetch.
     */
    orderBy?: notifications_outboxOrderByWithRelationInput | notifications_outboxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for notifications_outboxes.
     */
    cursor?: notifications_outboxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications_outboxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications_outboxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of notifications_outboxes.
     */
    distinct?: Notifications_outboxScalarFieldEnum | Notifications_outboxScalarFieldEnum[]
  }

  /**
   * notifications_outbox findMany
   */
  export type notifications_outboxFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter, which notifications_outboxes to fetch.
     */
    where?: notifications_outboxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of notifications_outboxes to fetch.
     */
    orderBy?: notifications_outboxOrderByWithRelationInput | notifications_outboxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing notifications_outboxes.
     */
    cursor?: notifications_outboxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` notifications_outboxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` notifications_outboxes.
     */
    skip?: number
    distinct?: Notifications_outboxScalarFieldEnum | Notifications_outboxScalarFieldEnum[]
  }

  /**
   * notifications_outbox create
   */
  export type notifications_outboxCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * The data needed to create a notifications_outbox.
     */
    data: XOR<notifications_outboxCreateInput, notifications_outboxUncheckedCreateInput>
  }

  /**
   * notifications_outbox createMany
   */
  export type notifications_outboxCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many notifications_outboxes.
     */
    data: notifications_outboxCreateManyInput | notifications_outboxCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * notifications_outbox createManyAndReturn
   */
  export type notifications_outboxCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * The data used to create many notifications_outboxes.
     */
    data: notifications_outboxCreateManyInput | notifications_outboxCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * notifications_outbox update
   */
  export type notifications_outboxUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * The data needed to update a notifications_outbox.
     */
    data: XOR<notifications_outboxUpdateInput, notifications_outboxUncheckedUpdateInput>
    /**
     * Choose, which notifications_outbox to update.
     */
    where: notifications_outboxWhereUniqueInput
  }

  /**
   * notifications_outbox updateMany
   */
  export type notifications_outboxUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update notifications_outboxes.
     */
    data: XOR<notifications_outboxUpdateManyMutationInput, notifications_outboxUncheckedUpdateManyInput>
    /**
     * Filter which notifications_outboxes to update
     */
    where?: notifications_outboxWhereInput
    /**
     * Limit how many notifications_outboxes to update.
     */
    limit?: number
  }

  /**
   * notifications_outbox updateManyAndReturn
   */
  export type notifications_outboxUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * The data used to update notifications_outboxes.
     */
    data: XOR<notifications_outboxUpdateManyMutationInput, notifications_outboxUncheckedUpdateManyInput>
    /**
     * Filter which notifications_outboxes to update
     */
    where?: notifications_outboxWhereInput
    /**
     * Limit how many notifications_outboxes to update.
     */
    limit?: number
  }

  /**
   * notifications_outbox upsert
   */
  export type notifications_outboxUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * The filter to search for the notifications_outbox to update in case it exists.
     */
    where: notifications_outboxWhereUniqueInput
    /**
     * In case the notifications_outbox found by the `where` argument doesn't exist, create a new notifications_outbox with this data.
     */
    create: XOR<notifications_outboxCreateInput, notifications_outboxUncheckedCreateInput>
    /**
     * In case the notifications_outbox was found with the provided `where` argument, update it with this data.
     */
    update: XOR<notifications_outboxUpdateInput, notifications_outboxUncheckedUpdateInput>
  }

  /**
   * notifications_outbox delete
   */
  export type notifications_outboxDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
    /**
     * Filter which notifications_outbox to delete.
     */
    where: notifications_outboxWhereUniqueInput
  }

  /**
   * notifications_outbox deleteMany
   */
  export type notifications_outboxDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which notifications_outboxes to delete
     */
    where?: notifications_outboxWhereInput
    /**
     * Limit how many notifications_outboxes to delete.
     */
    limit?: number
  }

  /**
   * notifications_outbox without action
   */
  export type notifications_outboxDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the notifications_outbox
     */
    select?: notifications_outboxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the notifications_outbox
     */
    omit?: notifications_outboxOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TenantsScalarFieldEnum: {
    id: 'id',
    name: 'name',
    subdomain: 'subdomain',
    schema: 'schema',
    modules: 'modules'
  };

  export type TenantsScalarFieldEnum = (typeof TenantsScalarFieldEnum)[keyof typeof TenantsScalarFieldEnum]


  export const Employee_door_tasksScalarFieldEnum: {
    id: 'id',
    tenant_id: 'tenant_id',
    employee_id: 'employee_id',
    door_id: 'door_id',
    action: 'action',
    status: 'status',
    retry_count: 'retry_count',
    error: 'error',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Employee_door_tasksScalarFieldEnum = (typeof Employee_door_tasksScalarFieldEnum)[keyof typeof Employee_door_tasksScalarFieldEnum]


  export const Tenant_telegram_usersScalarFieldEnum: {
    telegram_id: 'telegram_id',
    tenant_id: 'tenant_id',
    created_at: 'created_at'
  };

  export type Tenant_telegram_usersScalarFieldEnum = (typeof Tenant_telegram_usersScalarFieldEnum)[keyof typeof Tenant_telegram_usersScalarFieldEnum]


  export const Notifications_outboxScalarFieldEnum: {
    id: 'id',
    source_type: 'source_type',
    event_date: 'event_date',
    chat_id: 'chat_id',
    payload: 'payload',
    status: 'status',
    error: 'error',
    retry_count: 'retry_count',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Notifications_outboxScalarFieldEnum = (typeof Notifications_outboxScalarFieldEnum)[keyof typeof Notifications_outboxScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'NotificationSourceType'
   */
  export type EnumNotificationSourceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationSourceType'>
    


  /**
   * Reference to a field of type 'NotificationSourceType[]'
   */
  export type ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationSourceType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type tenantsWhereInput = {
    AND?: tenantsWhereInput | tenantsWhereInput[]
    OR?: tenantsWhereInput[]
    NOT?: tenantsWhereInput | tenantsWhereInput[]
    id?: IntFilter<"tenants"> | number
    name?: StringFilter<"tenants"> | string
    subdomain?: StringFilter<"tenants"> | string
    schema?: StringFilter<"tenants"> | string
    modules?: StringNullableListFilter<"tenants">
    telegram_users?: Tenant_telegram_usersListRelationFilter
    door_tasks?: Employee_door_tasksListRelationFilter
  }

  export type tenantsOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    subdomain?: SortOrder
    schema?: SortOrder
    modules?: SortOrder
    telegram_users?: tenant_telegram_usersOrderByRelationAggregateInput
    door_tasks?: employee_door_tasksOrderByRelationAggregateInput
  }

  export type tenantsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    subdomain?: string
    AND?: tenantsWhereInput | tenantsWhereInput[]
    OR?: tenantsWhereInput[]
    NOT?: tenantsWhereInput | tenantsWhereInput[]
    name?: StringFilter<"tenants"> | string
    schema?: StringFilter<"tenants"> | string
    modules?: StringNullableListFilter<"tenants">
    telegram_users?: Tenant_telegram_usersListRelationFilter
    door_tasks?: Employee_door_tasksListRelationFilter
  }, "id" | "subdomain">

  export type tenantsOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    subdomain?: SortOrder
    schema?: SortOrder
    modules?: SortOrder
    _count?: tenantsCountOrderByAggregateInput
    _avg?: tenantsAvgOrderByAggregateInput
    _max?: tenantsMaxOrderByAggregateInput
    _min?: tenantsMinOrderByAggregateInput
    _sum?: tenantsSumOrderByAggregateInput
  }

  export type tenantsScalarWhereWithAggregatesInput = {
    AND?: tenantsScalarWhereWithAggregatesInput | tenantsScalarWhereWithAggregatesInput[]
    OR?: tenantsScalarWhereWithAggregatesInput[]
    NOT?: tenantsScalarWhereWithAggregatesInput | tenantsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"tenants"> | number
    name?: StringWithAggregatesFilter<"tenants"> | string
    subdomain?: StringWithAggregatesFilter<"tenants"> | string
    schema?: StringWithAggregatesFilter<"tenants"> | string
    modules?: StringNullableListFilter<"tenants">
  }

  export type employee_door_tasksWhereInput = {
    AND?: employee_door_tasksWhereInput | employee_door_tasksWhereInput[]
    OR?: employee_door_tasksWhereInput[]
    NOT?: employee_door_tasksWhereInput | employee_door_tasksWhereInput[]
    id?: IntFilter<"employee_door_tasks"> | number
    tenant_id?: IntFilter<"employee_door_tasks"> | number
    employee_id?: IntFilter<"employee_door_tasks"> | number
    door_id?: IntFilter<"employee_door_tasks"> | number
    action?: StringFilter<"employee_door_tasks"> | string
    status?: StringFilter<"employee_door_tasks"> | string
    retry_count?: IntFilter<"employee_door_tasks"> | number
    error?: StringNullableFilter<"employee_door_tasks"> | string | null
    created_at?: DateTimeFilter<"employee_door_tasks"> | Date | string
    updated_at?: DateTimeNullableFilter<"employee_door_tasks"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type employee_door_tasksOrderByWithRelationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    action?: SortOrder
    status?: SortOrder
    retry_count?: SortOrder
    error?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrderInput | SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type employee_door_tasksWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: employee_door_tasksWhereInput | employee_door_tasksWhereInput[]
    OR?: employee_door_tasksWhereInput[]
    NOT?: employee_door_tasksWhereInput | employee_door_tasksWhereInput[]
    tenant_id?: IntFilter<"employee_door_tasks"> | number
    employee_id?: IntFilter<"employee_door_tasks"> | number
    door_id?: IntFilter<"employee_door_tasks"> | number
    action?: StringFilter<"employee_door_tasks"> | string
    status?: StringFilter<"employee_door_tasks"> | string
    retry_count?: IntFilter<"employee_door_tasks"> | number
    error?: StringNullableFilter<"employee_door_tasks"> | string | null
    created_at?: DateTimeFilter<"employee_door_tasks"> | Date | string
    updated_at?: DateTimeNullableFilter<"employee_door_tasks"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id">

  export type employee_door_tasksOrderByWithAggregationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    action?: SortOrder
    status?: SortOrder
    retry_count?: SortOrder
    error?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrderInput | SortOrder
    _count?: employee_door_tasksCountOrderByAggregateInput
    _avg?: employee_door_tasksAvgOrderByAggregateInput
    _max?: employee_door_tasksMaxOrderByAggregateInput
    _min?: employee_door_tasksMinOrderByAggregateInput
    _sum?: employee_door_tasksSumOrderByAggregateInput
  }

  export type employee_door_tasksScalarWhereWithAggregatesInput = {
    AND?: employee_door_tasksScalarWhereWithAggregatesInput | employee_door_tasksScalarWhereWithAggregatesInput[]
    OR?: employee_door_tasksScalarWhereWithAggregatesInput[]
    NOT?: employee_door_tasksScalarWhereWithAggregatesInput | employee_door_tasksScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"employee_door_tasks"> | number
    tenant_id?: IntWithAggregatesFilter<"employee_door_tasks"> | number
    employee_id?: IntWithAggregatesFilter<"employee_door_tasks"> | number
    door_id?: IntWithAggregatesFilter<"employee_door_tasks"> | number
    action?: StringWithAggregatesFilter<"employee_door_tasks"> | string
    status?: StringWithAggregatesFilter<"employee_door_tasks"> | string
    retry_count?: IntWithAggregatesFilter<"employee_door_tasks"> | number
    error?: StringNullableWithAggregatesFilter<"employee_door_tasks"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"employee_door_tasks"> | Date | string
    updated_at?: DateTimeNullableWithAggregatesFilter<"employee_door_tasks"> | Date | string | null
  }

  export type tenant_telegram_usersWhereInput = {
    AND?: tenant_telegram_usersWhereInput | tenant_telegram_usersWhereInput[]
    OR?: tenant_telegram_usersWhereInput[]
    NOT?: tenant_telegram_usersWhereInput | tenant_telegram_usersWhereInput[]
    telegram_id?: StringFilter<"tenant_telegram_users"> | string
    tenant_id?: IntFilter<"tenant_telegram_users"> | number
    created_at?: DateTimeFilter<"tenant_telegram_users"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type tenant_telegram_usersOrderByWithRelationInput = {
    telegram_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type tenant_telegram_usersWhereUniqueInput = Prisma.AtLeast<{
    telegram_id?: string
    telegram_id_tenant_id?: tenant_telegram_usersTelegram_idTenant_idCompoundUniqueInput
    AND?: tenant_telegram_usersWhereInput | tenant_telegram_usersWhereInput[]
    OR?: tenant_telegram_usersWhereInput[]
    NOT?: tenant_telegram_usersWhereInput | tenant_telegram_usersWhereInput[]
    tenant_id?: IntFilter<"tenant_telegram_users"> | number
    created_at?: DateTimeFilter<"tenant_telegram_users"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "telegram_id_tenant_id" | "telegram_id">

  export type tenant_telegram_usersOrderByWithAggregationInput = {
    telegram_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
    _count?: tenant_telegram_usersCountOrderByAggregateInput
    _avg?: tenant_telegram_usersAvgOrderByAggregateInput
    _max?: tenant_telegram_usersMaxOrderByAggregateInput
    _min?: tenant_telegram_usersMinOrderByAggregateInput
    _sum?: tenant_telegram_usersSumOrderByAggregateInput
  }

  export type tenant_telegram_usersScalarWhereWithAggregatesInput = {
    AND?: tenant_telegram_usersScalarWhereWithAggregatesInput | tenant_telegram_usersScalarWhereWithAggregatesInput[]
    OR?: tenant_telegram_usersScalarWhereWithAggregatesInput[]
    NOT?: tenant_telegram_usersScalarWhereWithAggregatesInput | tenant_telegram_usersScalarWhereWithAggregatesInput[]
    telegram_id?: StringWithAggregatesFilter<"tenant_telegram_users"> | string
    tenant_id?: IntWithAggregatesFilter<"tenant_telegram_users"> | number
    created_at?: DateTimeWithAggregatesFilter<"tenant_telegram_users"> | Date | string
  }

  export type notifications_outboxWhereInput = {
    AND?: notifications_outboxWhereInput | notifications_outboxWhereInput[]
    OR?: notifications_outboxWhereInput[]
    NOT?: notifications_outboxWhereInput | notifications_outboxWhereInput[]
    id?: IntFilter<"notifications_outbox"> | number
    source_type?: EnumNotificationSourceTypeFilter<"notifications_outbox"> | $Enums.NotificationSourceType
    event_date?: DateTimeFilter<"notifications_outbox"> | Date | string
    chat_id?: StringFilter<"notifications_outbox"> | string
    payload?: JsonFilter<"notifications_outbox">
    status?: StringFilter<"notifications_outbox"> | string
    error?: StringNullableFilter<"notifications_outbox"> | string | null
    retry_count?: IntFilter<"notifications_outbox"> | number
    created_at?: DateTimeFilter<"notifications_outbox"> | Date | string
    updated_at?: DateTimeFilter<"notifications_outbox"> | Date | string
  }

  export type notifications_outboxOrderByWithRelationInput = {
    id?: SortOrder
    source_type?: SortOrder
    event_date?: SortOrder
    chat_id?: SortOrder
    payload?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    retry_count?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type notifications_outboxWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: notifications_outboxWhereInput | notifications_outboxWhereInput[]
    OR?: notifications_outboxWhereInput[]
    NOT?: notifications_outboxWhereInput | notifications_outboxWhereInput[]
    source_type?: EnumNotificationSourceTypeFilter<"notifications_outbox"> | $Enums.NotificationSourceType
    event_date?: DateTimeFilter<"notifications_outbox"> | Date | string
    chat_id?: StringFilter<"notifications_outbox"> | string
    payload?: JsonFilter<"notifications_outbox">
    status?: StringFilter<"notifications_outbox"> | string
    error?: StringNullableFilter<"notifications_outbox"> | string | null
    retry_count?: IntFilter<"notifications_outbox"> | number
    created_at?: DateTimeFilter<"notifications_outbox"> | Date | string
    updated_at?: DateTimeFilter<"notifications_outbox"> | Date | string
  }, "id">

  export type notifications_outboxOrderByWithAggregationInput = {
    id?: SortOrder
    source_type?: SortOrder
    event_date?: SortOrder
    chat_id?: SortOrder
    payload?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    retry_count?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: notifications_outboxCountOrderByAggregateInput
    _avg?: notifications_outboxAvgOrderByAggregateInput
    _max?: notifications_outboxMaxOrderByAggregateInput
    _min?: notifications_outboxMinOrderByAggregateInput
    _sum?: notifications_outboxSumOrderByAggregateInput
  }

  export type notifications_outboxScalarWhereWithAggregatesInput = {
    AND?: notifications_outboxScalarWhereWithAggregatesInput | notifications_outboxScalarWhereWithAggregatesInput[]
    OR?: notifications_outboxScalarWhereWithAggregatesInput[]
    NOT?: notifications_outboxScalarWhereWithAggregatesInput | notifications_outboxScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"notifications_outbox"> | number
    source_type?: EnumNotificationSourceTypeWithAggregatesFilter<"notifications_outbox"> | $Enums.NotificationSourceType
    event_date?: DateTimeWithAggregatesFilter<"notifications_outbox"> | Date | string
    chat_id?: StringWithAggregatesFilter<"notifications_outbox"> | string
    payload?: JsonWithAggregatesFilter<"notifications_outbox">
    status?: StringWithAggregatesFilter<"notifications_outbox"> | string
    error?: StringNullableWithAggregatesFilter<"notifications_outbox"> | string | null
    retry_count?: IntWithAggregatesFilter<"notifications_outbox"> | number
    created_at?: DateTimeWithAggregatesFilter<"notifications_outbox"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"notifications_outbox"> | Date | string
  }

  export type tenantsCreateInput = {
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersCreateNestedManyWithoutTenantInput
    door_tasks?: employee_door_tasksCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateInput = {
    id?: number
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUncheckedCreateNestedManyWithoutTenantInput
    door_tasks?: employee_door_tasksUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUpdateManyWithoutTenantNestedInput
    door_tasks?: employee_door_tasksUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUncheckedUpdateManyWithoutTenantNestedInput
    door_tasks?: employee_door_tasksUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateManyInput = {
    id?: number
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
  }

  export type tenantsUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
  }

  export type tenantsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
  }

  export type employee_door_tasksCreateInput = {
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
    tenant: tenantsCreateNestedOneWithoutDoor_tasksInput
  }

  export type employee_door_tasksUncheckedCreateInput = {
    id?: number
    tenant_id: number
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
  }

  export type employee_door_tasksUpdateInput = {
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant?: tenantsUpdateOneRequiredWithoutDoor_tasksNestedInput
  }

  export type employee_door_tasksUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    tenant_id?: IntFieldUpdateOperationsInput | number
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type employee_door_tasksCreateManyInput = {
    id?: number
    tenant_id: number
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
  }

  export type employee_door_tasksUpdateManyMutationInput = {
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type employee_door_tasksUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    tenant_id?: IntFieldUpdateOperationsInput | number
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_telegram_usersCreateInput = {
    telegram_id: string
    created_at?: Date | string
    tenant: tenantsCreateNestedOneWithoutTelegram_usersInput
  }

  export type tenant_telegram_usersUncheckedCreateInput = {
    telegram_id: string
    tenant_id: number
    created_at?: Date | string
  }

  export type tenant_telegram_usersUpdateInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: tenantsUpdateOneRequiredWithoutTelegram_usersNestedInput
  }

  export type tenant_telegram_usersUncheckedUpdateInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_telegram_usersCreateManyInput = {
    telegram_id: string
    tenant_id: number
    created_at?: Date | string
  }

  export type tenant_telegram_usersUpdateManyMutationInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_telegram_usersUncheckedUpdateManyInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type notifications_outboxCreateInput = {
    source_type: $Enums.NotificationSourceType
    event_date: Date | string
    chat_id: string
    payload: JsonNullValueInput | InputJsonValue
    status?: string
    error?: string | null
    retry_count?: number
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type notifications_outboxUncheckedCreateInput = {
    id?: number
    source_type: $Enums.NotificationSourceType
    event_date: Date | string
    chat_id: string
    payload: JsonNullValueInput | InputJsonValue
    status?: string
    error?: string | null
    retry_count?: number
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type notifications_outboxUpdateInput = {
    source_type?: EnumNotificationSourceTypeFieldUpdateOperationsInput | $Enums.NotificationSourceType
    event_date?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_id?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    retry_count?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type notifications_outboxUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    source_type?: EnumNotificationSourceTypeFieldUpdateOperationsInput | $Enums.NotificationSourceType
    event_date?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_id?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    retry_count?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type notifications_outboxCreateManyInput = {
    id?: number
    source_type: $Enums.NotificationSourceType
    event_date: Date | string
    chat_id: string
    payload: JsonNullValueInput | InputJsonValue
    status?: string
    error?: string | null
    retry_count?: number
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type notifications_outboxUpdateManyMutationInput = {
    source_type?: EnumNotificationSourceTypeFieldUpdateOperationsInput | $Enums.NotificationSourceType
    event_date?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_id?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    retry_count?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type notifications_outboxUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    source_type?: EnumNotificationSourceTypeFieldUpdateOperationsInput | $Enums.NotificationSourceType
    event_date?: DateTimeFieldUpdateOperationsInput | Date | string
    chat_id?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    retry_count?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type Tenant_telegram_usersListRelationFilter = {
    every?: tenant_telegram_usersWhereInput
    some?: tenant_telegram_usersWhereInput
    none?: tenant_telegram_usersWhereInput
  }

  export type Employee_door_tasksListRelationFilter = {
    every?: employee_door_tasksWhereInput
    some?: employee_door_tasksWhereInput
    none?: employee_door_tasksWhereInput
  }

  export type tenant_telegram_usersOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type employee_door_tasksOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type tenantsCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    subdomain?: SortOrder
    schema?: SortOrder
    modules?: SortOrder
  }

  export type tenantsAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type tenantsMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    subdomain?: SortOrder
    schema?: SortOrder
  }

  export type tenantsMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    subdomain?: SortOrder
    schema?: SortOrder
  }

  export type tenantsSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type TenantsScalarRelationFilter = {
    is?: tenantsWhereInput
    isNot?: tenantsWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type employee_door_tasksCountOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    action?: SortOrder
    status?: SortOrder
    retry_count?: SortOrder
    error?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type employee_door_tasksAvgOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    retry_count?: SortOrder
  }

  export type employee_door_tasksMaxOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    action?: SortOrder
    status?: SortOrder
    retry_count?: SortOrder
    error?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type employee_door_tasksMinOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    action?: SortOrder
    status?: SortOrder
    retry_count?: SortOrder
    error?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type employee_door_tasksSumOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    employee_id?: SortOrder
    door_id?: SortOrder
    retry_count?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type tenant_telegram_usersTelegram_idTenant_idCompoundUniqueInput = {
    telegram_id: string
    tenant_id: number
  }

  export type tenant_telegram_usersCountOrderByAggregateInput = {
    telegram_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type tenant_telegram_usersAvgOrderByAggregateInput = {
    tenant_id?: SortOrder
  }

  export type tenant_telegram_usersMaxOrderByAggregateInput = {
    telegram_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type tenant_telegram_usersMinOrderByAggregateInput = {
    telegram_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type tenant_telegram_usersSumOrderByAggregateInput = {
    tenant_id?: SortOrder
  }

  export type EnumNotificationSourceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationSourceType | EnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationSourceTypeFilter<$PrismaModel> | $Enums.NotificationSourceType
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type notifications_outboxCountOrderByAggregateInput = {
    id?: SortOrder
    source_type?: SortOrder
    event_date?: SortOrder
    chat_id?: SortOrder
    payload?: SortOrder
    status?: SortOrder
    error?: SortOrder
    retry_count?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type notifications_outboxAvgOrderByAggregateInput = {
    id?: SortOrder
    retry_count?: SortOrder
  }

  export type notifications_outboxMaxOrderByAggregateInput = {
    id?: SortOrder
    source_type?: SortOrder
    event_date?: SortOrder
    chat_id?: SortOrder
    status?: SortOrder
    error?: SortOrder
    retry_count?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type notifications_outboxMinOrderByAggregateInput = {
    id?: SortOrder
    source_type?: SortOrder
    event_date?: SortOrder
    chat_id?: SortOrder
    status?: SortOrder
    error?: SortOrder
    retry_count?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type notifications_outboxSumOrderByAggregateInput = {
    id?: SortOrder
    retry_count?: SortOrder
  }

  export type EnumNotificationSourceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationSourceType | EnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationSourceTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationSourceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationSourceTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationSourceTypeFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type tenantsCreatemodulesInput = {
    set: string[]
  }

  export type tenant_telegram_usersCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput> | tenant_telegram_usersCreateWithoutTenantInput[] | tenant_telegram_usersUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_telegram_usersCreateOrConnectWithoutTenantInput | tenant_telegram_usersCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_telegram_usersCreateManyTenantInputEnvelope
    connect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
  }

  export type employee_door_tasksCreateNestedManyWithoutTenantInput = {
    create?: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput> | employee_door_tasksCreateWithoutTenantInput[] | employee_door_tasksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: employee_door_tasksCreateOrConnectWithoutTenantInput | employee_door_tasksCreateOrConnectWithoutTenantInput[]
    createMany?: employee_door_tasksCreateManyTenantInputEnvelope
    connect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
  }

  export type tenant_telegram_usersUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput> | tenant_telegram_usersCreateWithoutTenantInput[] | tenant_telegram_usersUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_telegram_usersCreateOrConnectWithoutTenantInput | tenant_telegram_usersCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_telegram_usersCreateManyTenantInputEnvelope
    connect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
  }

  export type employee_door_tasksUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput> | employee_door_tasksCreateWithoutTenantInput[] | employee_door_tasksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: employee_door_tasksCreateOrConnectWithoutTenantInput | employee_door_tasksCreateOrConnectWithoutTenantInput[]
    createMany?: employee_door_tasksCreateManyTenantInputEnvelope
    connect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type tenantsUpdatemodulesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type tenant_telegram_usersUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput> | tenant_telegram_usersCreateWithoutTenantInput[] | tenant_telegram_usersUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_telegram_usersCreateOrConnectWithoutTenantInput | tenant_telegram_usersCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_telegram_usersUpsertWithWhereUniqueWithoutTenantInput | tenant_telegram_usersUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_telegram_usersCreateManyTenantInputEnvelope
    set?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    disconnect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    delete?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    connect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    update?: tenant_telegram_usersUpdateWithWhereUniqueWithoutTenantInput | tenant_telegram_usersUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_telegram_usersUpdateManyWithWhereWithoutTenantInput | tenant_telegram_usersUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_telegram_usersScalarWhereInput | tenant_telegram_usersScalarWhereInput[]
  }

  export type employee_door_tasksUpdateManyWithoutTenantNestedInput = {
    create?: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput> | employee_door_tasksCreateWithoutTenantInput[] | employee_door_tasksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: employee_door_tasksCreateOrConnectWithoutTenantInput | employee_door_tasksCreateOrConnectWithoutTenantInput[]
    upsert?: employee_door_tasksUpsertWithWhereUniqueWithoutTenantInput | employee_door_tasksUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: employee_door_tasksCreateManyTenantInputEnvelope
    set?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    disconnect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    delete?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    connect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    update?: employee_door_tasksUpdateWithWhereUniqueWithoutTenantInput | employee_door_tasksUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: employee_door_tasksUpdateManyWithWhereWithoutTenantInput | employee_door_tasksUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: employee_door_tasksScalarWhereInput | employee_door_tasksScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type tenant_telegram_usersUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput> | tenant_telegram_usersCreateWithoutTenantInput[] | tenant_telegram_usersUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_telegram_usersCreateOrConnectWithoutTenantInput | tenant_telegram_usersCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_telegram_usersUpsertWithWhereUniqueWithoutTenantInput | tenant_telegram_usersUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_telegram_usersCreateManyTenantInputEnvelope
    set?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    disconnect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    delete?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    connect?: tenant_telegram_usersWhereUniqueInput | tenant_telegram_usersWhereUniqueInput[]
    update?: tenant_telegram_usersUpdateWithWhereUniqueWithoutTenantInput | tenant_telegram_usersUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_telegram_usersUpdateManyWithWhereWithoutTenantInput | tenant_telegram_usersUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_telegram_usersScalarWhereInput | tenant_telegram_usersScalarWhereInput[]
  }

  export type employee_door_tasksUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput> | employee_door_tasksCreateWithoutTenantInput[] | employee_door_tasksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: employee_door_tasksCreateOrConnectWithoutTenantInput | employee_door_tasksCreateOrConnectWithoutTenantInput[]
    upsert?: employee_door_tasksUpsertWithWhereUniqueWithoutTenantInput | employee_door_tasksUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: employee_door_tasksCreateManyTenantInputEnvelope
    set?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    disconnect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    delete?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    connect?: employee_door_tasksWhereUniqueInput | employee_door_tasksWhereUniqueInput[]
    update?: employee_door_tasksUpdateWithWhereUniqueWithoutTenantInput | employee_door_tasksUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: employee_door_tasksUpdateManyWithWhereWithoutTenantInput | employee_door_tasksUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: employee_door_tasksScalarWhereInput | employee_door_tasksScalarWhereInput[]
  }

  export type tenantsCreateNestedOneWithoutDoor_tasksInput = {
    create?: XOR<tenantsCreateWithoutDoor_tasksInput, tenantsUncheckedCreateWithoutDoor_tasksInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutDoor_tasksInput
    connect?: tenantsWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type tenantsUpdateOneRequiredWithoutDoor_tasksNestedInput = {
    create?: XOR<tenantsCreateWithoutDoor_tasksInput, tenantsUncheckedCreateWithoutDoor_tasksInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutDoor_tasksInput
    upsert?: tenantsUpsertWithoutDoor_tasksInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutDoor_tasksInput, tenantsUpdateWithoutDoor_tasksInput>, tenantsUncheckedUpdateWithoutDoor_tasksInput>
  }

  export type tenantsCreateNestedOneWithoutTelegram_usersInput = {
    create?: XOR<tenantsCreateWithoutTelegram_usersInput, tenantsUncheckedCreateWithoutTelegram_usersInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTelegram_usersInput
    connect?: tenantsWhereUniqueInput
  }

  export type tenantsUpdateOneRequiredWithoutTelegram_usersNestedInput = {
    create?: XOR<tenantsCreateWithoutTelegram_usersInput, tenantsUncheckedCreateWithoutTelegram_usersInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTelegram_usersInput
    upsert?: tenantsUpsertWithoutTelegram_usersInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutTelegram_usersInput, tenantsUpdateWithoutTelegram_usersInput>, tenantsUncheckedUpdateWithoutTelegram_usersInput>
  }

  export type EnumNotificationSourceTypeFieldUpdateOperationsInput = {
    set?: $Enums.NotificationSourceType
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumNotificationSourceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationSourceType | EnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationSourceTypeFilter<$PrismaModel> | $Enums.NotificationSourceType
  }

  export type NestedEnumNotificationSourceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationSourceType | EnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationSourceType[] | ListEnumNotificationSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationSourceTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationSourceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationSourceTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationSourceTypeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type tenant_telegram_usersCreateWithoutTenantInput = {
    telegram_id: string
    created_at?: Date | string
  }

  export type tenant_telegram_usersUncheckedCreateWithoutTenantInput = {
    telegram_id: string
    created_at?: Date | string
  }

  export type tenant_telegram_usersCreateOrConnectWithoutTenantInput = {
    where: tenant_telegram_usersWhereUniqueInput
    create: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput>
  }

  export type tenant_telegram_usersCreateManyTenantInputEnvelope = {
    data: tenant_telegram_usersCreateManyTenantInput | tenant_telegram_usersCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type employee_door_tasksCreateWithoutTenantInput = {
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
  }

  export type employee_door_tasksUncheckedCreateWithoutTenantInput = {
    id?: number
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
  }

  export type employee_door_tasksCreateOrConnectWithoutTenantInput = {
    where: employee_door_tasksWhereUniqueInput
    create: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput>
  }

  export type employee_door_tasksCreateManyTenantInputEnvelope = {
    data: employee_door_tasksCreateManyTenantInput | employee_door_tasksCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type tenant_telegram_usersUpsertWithWhereUniqueWithoutTenantInput = {
    where: tenant_telegram_usersWhereUniqueInput
    update: XOR<tenant_telegram_usersUpdateWithoutTenantInput, tenant_telegram_usersUncheckedUpdateWithoutTenantInput>
    create: XOR<tenant_telegram_usersCreateWithoutTenantInput, tenant_telegram_usersUncheckedCreateWithoutTenantInput>
  }

  export type tenant_telegram_usersUpdateWithWhereUniqueWithoutTenantInput = {
    where: tenant_telegram_usersWhereUniqueInput
    data: XOR<tenant_telegram_usersUpdateWithoutTenantInput, tenant_telegram_usersUncheckedUpdateWithoutTenantInput>
  }

  export type tenant_telegram_usersUpdateManyWithWhereWithoutTenantInput = {
    where: tenant_telegram_usersScalarWhereInput
    data: XOR<tenant_telegram_usersUpdateManyMutationInput, tenant_telegram_usersUncheckedUpdateManyWithoutTenantInput>
  }

  export type tenant_telegram_usersScalarWhereInput = {
    AND?: tenant_telegram_usersScalarWhereInput | tenant_telegram_usersScalarWhereInput[]
    OR?: tenant_telegram_usersScalarWhereInput[]
    NOT?: tenant_telegram_usersScalarWhereInput | tenant_telegram_usersScalarWhereInput[]
    telegram_id?: StringFilter<"tenant_telegram_users"> | string
    tenant_id?: IntFilter<"tenant_telegram_users"> | number
    created_at?: DateTimeFilter<"tenant_telegram_users"> | Date | string
  }

  export type employee_door_tasksUpsertWithWhereUniqueWithoutTenantInput = {
    where: employee_door_tasksWhereUniqueInput
    update: XOR<employee_door_tasksUpdateWithoutTenantInput, employee_door_tasksUncheckedUpdateWithoutTenantInput>
    create: XOR<employee_door_tasksCreateWithoutTenantInput, employee_door_tasksUncheckedCreateWithoutTenantInput>
  }

  export type employee_door_tasksUpdateWithWhereUniqueWithoutTenantInput = {
    where: employee_door_tasksWhereUniqueInput
    data: XOR<employee_door_tasksUpdateWithoutTenantInput, employee_door_tasksUncheckedUpdateWithoutTenantInput>
  }

  export type employee_door_tasksUpdateManyWithWhereWithoutTenantInput = {
    where: employee_door_tasksScalarWhereInput
    data: XOR<employee_door_tasksUpdateManyMutationInput, employee_door_tasksUncheckedUpdateManyWithoutTenantInput>
  }

  export type employee_door_tasksScalarWhereInput = {
    AND?: employee_door_tasksScalarWhereInput | employee_door_tasksScalarWhereInput[]
    OR?: employee_door_tasksScalarWhereInput[]
    NOT?: employee_door_tasksScalarWhereInput | employee_door_tasksScalarWhereInput[]
    id?: IntFilter<"employee_door_tasks"> | number
    tenant_id?: IntFilter<"employee_door_tasks"> | number
    employee_id?: IntFilter<"employee_door_tasks"> | number
    door_id?: IntFilter<"employee_door_tasks"> | number
    action?: StringFilter<"employee_door_tasks"> | string
    status?: StringFilter<"employee_door_tasks"> | string
    retry_count?: IntFilter<"employee_door_tasks"> | number
    error?: StringNullableFilter<"employee_door_tasks"> | string | null
    created_at?: DateTimeFilter<"employee_door_tasks"> | Date | string
    updated_at?: DateTimeNullableFilter<"employee_door_tasks"> | Date | string | null
  }

  export type tenantsCreateWithoutDoor_tasksInput = {
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutDoor_tasksInput = {
    id?: number
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutDoor_tasksInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutDoor_tasksInput, tenantsUncheckedCreateWithoutDoor_tasksInput>
  }

  export type tenantsUpsertWithoutDoor_tasksInput = {
    update: XOR<tenantsUpdateWithoutDoor_tasksInput, tenantsUncheckedUpdateWithoutDoor_tasksInput>
    create: XOR<tenantsCreateWithoutDoor_tasksInput, tenantsUncheckedCreateWithoutDoor_tasksInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutDoor_tasksInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutDoor_tasksInput, tenantsUncheckedUpdateWithoutDoor_tasksInput>
  }

  export type tenantsUpdateWithoutDoor_tasksInput = {
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutDoor_tasksInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    telegram_users?: tenant_telegram_usersUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateWithoutTelegram_usersInput = {
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    door_tasks?: employee_door_tasksCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutTelegram_usersInput = {
    id?: number
    name: string
    subdomain: string
    schema: string
    modules?: tenantsCreatemodulesInput | string[]
    door_tasks?: employee_door_tasksUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutTelegram_usersInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutTelegram_usersInput, tenantsUncheckedCreateWithoutTelegram_usersInput>
  }

  export type tenantsUpsertWithoutTelegram_usersInput = {
    update: XOR<tenantsUpdateWithoutTelegram_usersInput, tenantsUncheckedUpdateWithoutTelegram_usersInput>
    create: XOR<tenantsCreateWithoutTelegram_usersInput, tenantsUncheckedCreateWithoutTelegram_usersInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutTelegram_usersInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutTelegram_usersInput, tenantsUncheckedUpdateWithoutTelegram_usersInput>
  }

  export type tenantsUpdateWithoutTelegram_usersInput = {
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    door_tasks?: employee_door_tasksUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutTelegram_usersInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    schema?: StringFieldUpdateOperationsInput | string
    modules?: tenantsUpdatemodulesInput | string[]
    door_tasks?: employee_door_tasksUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenant_telegram_usersCreateManyTenantInput = {
    telegram_id: string
    created_at?: Date | string
  }

  export type employee_door_tasksCreateManyTenantInput = {
    id?: number
    employee_id: number
    door_id: number
    action: string
    status?: string
    retry_count?: number
    error?: string | null
    created_at?: Date | string
    updated_at?: Date | string | null
  }

  export type tenant_telegram_usersUpdateWithoutTenantInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_telegram_usersUncheckedUpdateWithoutTenantInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_telegram_usersUncheckedUpdateManyWithoutTenantInput = {
    telegram_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type employee_door_tasksUpdateWithoutTenantInput = {
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type employee_door_tasksUncheckedUpdateWithoutTenantInput = {
    id?: IntFieldUpdateOperationsInput | number
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type employee_door_tasksUncheckedUpdateManyWithoutTenantInput = {
    id?: IntFieldUpdateOperationsInput | number
    employee_id?: IntFieldUpdateOperationsInput | number
    door_id?: IntFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    retry_count?: IntFieldUpdateOperationsInput | number
    error?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}