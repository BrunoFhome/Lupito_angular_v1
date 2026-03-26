export const MensagensErroHttp: Record<number, string> = {
  0:   'Sem conexão com o servidor. Verifique sua internet.',
  400: 'Requisição inválida. Verifique os dados informados.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  408: 'A requisição demorou muito. Tente novamente.',
  409: 'Este registro já existe.',
  422: 'Dados inválidos. Verifique as informações e tente novamente.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'Erro interno do servidor. Tente novamente em instantes.',
  502: 'Servidor indisponível. Tente novamente em instantes.',
  503: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
};

export const ERRO_PADRAO = 'Ocorreu um erro inesperado. Tente novamente.';

export const ErrosAuth = {
  CREDENCIAIS_INVALIDAS: 'E-mail ou senha incorretos.',
  EMAIL_JA_CADASTRADO:   'Este e-mail já está cadastrado.',
  TOKEN_INVALIDO:        'Link de redefinição inválido ou expirado.',
  FALHA_REDEFINIR_SENHA: 'Não foi possível redefinir a senha. Tente novamente.',
  FALHA_ENVIAR_EMAIL:    'Não foi possível enviar o e-mail de redefinição. Verifique o endereço informado.',
};

export const ErrosLicao = {
  FALHA_CARREGAR:  'Não foi possível carregar a lição. Redirecionando...',
  FALHA_CONCLUIR:  'Não foi possível registrar o progresso da lição.',
};

export const ErrosPerfil = {
  FALHA_CARREGAR:    'Não foi possível carregar os dados do perfil.',
  FALHA_ATUALIZAR:   'Não foi possível salvar as alterações do perfil.',
  SESSAO_EXPIRADA:   'Sua sessão expirou. Faça login novamente.',
};

export const ErrosWorkspace = {
  FALHA_SALVAR:     'Não foi possível salvar. Código mantido localmente.',
  SALVO_NOVAMENTE:  'Código salvo com sucesso!',
};

export const ErrosKanban = {
  FALHA_CARREGAR:   'Não foi possível carregar as tarefas.',
  FALHA_CRIAR:      'Não foi possível criar a tarefa.',
  FALHA_ATUALIZAR:  'Não foi possível atualizar a tarefa.',
  FALHA_EXCLUIR:    'Não foi possível excluir a tarefa.',
};

export const ErrosDashboard = {
  FALHA_CARREGAR: 'Não foi possível carregar o painel. Tente novamente.',
};

export const ErrosTrilha = {
  FALHA_CARREGAR: 'Não foi possível carregar a trilha de aprendizado.',
};
